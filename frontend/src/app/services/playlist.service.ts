import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getGuestId } from '../utils/guest';
import { AuthService } from './auth.service';

const URL = 'https://vibevote-server.fly.dev';

const spotifyApiUrl = 'https://api.spotify.com/v1';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  accessToken = this.authService.getAccessToken();
  constructor(private http: HttpClient, private authService: AuthService) {}

  async createPlaylist(title: string, childFriendly: boolean): Promise<any> {
    try {
      if (this.authService.isTokenExpired() || !this.accessToken) {
        await this.authService.refreshAccessToken();
        this.accessToken = this.authService.getAccessToken();
      }

      const userId = await this.getUserId();
      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + this.accessToken
      );

      const spotifyPlaylist: any = await firstValueFrom(
        this.http.post(
          `${spotifyApiUrl}/users/${userId}/playlists`,
          { name: title },
          { headers }
        )
      );

      const backendPlaylist: any = await firstValueFrom(
        this.http.post(`${URL}/api/playlist/create`, {
          title,
          spotifyPlaylistId: spotifyPlaylist?.id,
          childFriendly,
        })
      );
      await this.updateTokens(
        backendPlaylist.spotifyPlaylistId,
        this.accessToken!,
        this.authService.getRefreshToken()!,
        (this.authService.getExpirationTime()! - Date.now()) / 1000
      );

      return backendPlaylist;
    } catch (error) {
      console.error('Failed to create playlist', error);
      throw error;
    }
  }

  async getUserId(): Promise<string> {
    try {
      if (this.authService.isTokenExpired() || !this.accessToken) {
        await this.authService.refreshAccessToken();
        this.accessToken = this.authService.getAccessToken();
      }

      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + this.accessToken
      );
      const response: any = await firstValueFrom(
        this.http.get(`${spotifyApiUrl}/me`, { headers })
      );
      return response.id;
    } catch (error) {
      console.error('Failed to get user ID', error);
      throw error;
    }
  }

  async getPlaylistBySpotifyId(
    playlistId: string,
    played?: boolean
  ): Promise<any> {
    try {
      let queryParams = '';
      if (played !== undefined) {
        queryParams = `?played=${played}`;
      }

      return await firstValueFrom(
        this.http.get<any>(`${URL}/api/playlist/${playlistId}${queryParams}`)
      );
    } catch (error) {
      console.error('Failed to get playlist by Spotify ID', error);
      throw error;
    }
  }

  async addTrackToPlaylist(playlistId: string, trackId: any): Promise<void> {
    try {
      const { accessToken, refreshToken, expiresIn } = await this.fetchTokens(
        playlistId
      );

      if (!accessToken) {
        await this.authService.refreshAccessToken(refreshToken);
      }
      this.authService.setAccessToken(accessToken, expiresIn);

      const spotifyPlaylist: any = await this.getPlaylistBySpotifyId(
        playlistId,
        false
      );
      const spotifyPlaylistId = spotifyPlaylist.spotifyPlaylistId;

      await firstValueFrom(
        this.http.post(`${URL}/api/playlist/${spotifyPlaylistId}/add-track`, {
          trackId,
          accessToken,
        })
      );
    } catch (error) {
      console.error('Failed to add track to playlist', error);
      throw error;
    }
  }

  async voteForTrack(
    playlistId: string,
    trackId: string,
    spotifyId: string
  ): Promise<void> {
    try {
      const guestId = getGuestId();
      await firstValueFrom(
        this.http.post(`${URL}/api/playlist/${playlistId}/vote`, {
          trackId,
          guestId,
          spotifyId,
        })
      );
    } catch (error) {
      console.error('Failed to vote for track', error);
      throw error;
    }
  }

  async deleteVote(
    playlistId: string,
    trackId: string,
    spotifyId: string
  ): Promise<void> {
    try {
      const guestId = getGuestId();

      await firstValueFrom(
        this.http.post(`${URL}/api/playlist/${playlistId}/vote`, {
          trackId,
          guestId,
          spotifyId,
        })
      );
    } catch (error) {
      console.error('Failed to delete vote', error);
      throw error;
    }
  }

  async updateTokens(
    playlistId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${URL}/api/playlist/${playlistId}/tokens`, {
          accessToken,
          refreshToken,
          expiresIn,
        })
      );
    } catch (error) {
      console.error('Error updating tokens', error);
    }
  }

  async fetchTokens(
    playlistId: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${URL}/api/playlist/${playlistId}/tokens`)
      );

      const expiresIn = response.spotifyTokenExpiresAt
        ? Math.floor(
            (new Date(response.spotifyTokenExpiresAt).getTime() - Date.now()) /
              1000
          )
        : 0;

      return {
        accessToken: response.spotifyAccessToken,
        refreshToken: response.spotifyRefreshToken,
        expiresIn,
      };
    } catch (error) {
      console.error('Error fetching tokens', error);
      throw error;
    }
  }

  async updatePlaylistOrder(playlistId: string): Promise<void> {
    try {
      const { accessToken, refreshToken, expiresIn } = await this.fetchTokens(
        playlistId
      );

      if (!accessToken) {
        await this.authService.refreshAccessToken(refreshToken);
      }
      this.authService.setAccessToken(accessToken, expiresIn);

      const playlist: any = await this.getPlaylistBySpotifyId(playlistId);

      const playedTracks = playlist.tracks.filter((track: any) => track.played);
      const unplayedTracks = playlist.tracks.filter(
        (track: any) => !track.played
      );

      const sortedUnplayedTracks = unplayedTracks.sort((a: any, b: any) => {
        return b.votes.length - a.votes.length;
      });

      let currentlyPlayingTrack = null;
      try {
        currentlyPlayingTrack = await this.getCurrentlyPlayingTrack(playlistId);
      } catch (error) {
        console.error('Failed to get currently playing track', error);
      }

      if (currentlyPlayingTrack) {
        const currentlyPlayingTrackId = currentlyPlayingTrack?.id;

        const playingTrackIndex = playedTracks.findIndex(
          (track: any) => track.spotifyId === currentlyPlayingTrackId
        );

        if (playingTrackIndex !== -1) {
          const [playingTrack] = playedTracks.splice(playingTrackIndex, 1);
          playedTracks.push(playingTrack);
        }
      }
      const sortedPlaylistTracks = [...playedTracks, ...sortedUnplayedTracks];

      const trackUris = sortedPlaylistTracks.map(
        (track: any) => `spotify:track:${track.spotifyId}`
      );

      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + accessToken
      );

      await firstValueFrom(
        this.http.put(
          `${spotifyApiUrl}/playlists/${playlistId}/tracks`,
          { uris: trackUris },
          { headers }
        )
      );

      return sortedUnplayedTracks;
    } catch (error) {
      console.error('Failed to update playlist order', error);
    }
  }

  async getCurrentlyPlayingTrack(playlistId: string): Promise<any> {
    try {
      const { accessToken, refreshToken, expiresIn } = await this.fetchTokens(
        playlistId
      );

      if (!accessToken) {
        await this.authService.refreshAccessToken(refreshToken);
      }
      this.authService.setAccessToken(accessToken, expiresIn);

      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + accessToken
      );
      const response: any = await firstValueFrom(
        this.http.get(`${spotifyApiUrl}/me/player/currently-playing`, {
          headers,
        })
      );
      return response.item;
    } catch (error) {
      console.error('Failed to get currently playing track', error);
      throw error;
    }
  }

  async markTracksAsPlayed(playlistId: string): Promise<void> {
    try {
      const playlist: any = await this.getPlaylistBySpotifyId(
        playlistId,
        false
      );
      const currentlyPlayingTrack = await this.getCurrentlyPlayingTrack(
        playlistId
      );
      const currentlyPlayingTrackId = currentlyPlayingTrack?.id;

      for (const track of playlist.tracks) {
        if (track.spotifyId === currentlyPlayingTrackId) {
          if (!track.played) {
            track.played = true;
            await this.updateTrackPlayedStatus(playlistId, track.id, true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to mark tracks as played', error);
    }
  }

  async updateTrackPlayedStatus(
    playlistId: string,
    trackId: number,
    played: boolean
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.put(
          `${URL}/api/playlist/${playlistId}/update-track-played-status/${trackId}`,
          { played }
        )
      );
    } catch (error) {
      console.error('Failed to updateTrackPlayedStatus', error);
      throw error;
    }
  }
}
