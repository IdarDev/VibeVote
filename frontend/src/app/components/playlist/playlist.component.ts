import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlaylistService } from 'src/app/services/playlist.service';
import { AddTrackComponent } from '../add-track/add-track.component';
import io from 'socket.io-client';
import BASE_URL from 'src/app/utils/baseUrl';

const socket = io(BASE_URL);

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css'],
})
export class PlaylistComponent implements OnInit {
  playlist: any;
  userVotes: boolean[] = [];
  addTrackVisible = false;

  @ViewChild(AddTrackComponent) addTrackComponent!: AddTrackComponent;

  constructor(
    private route: ActivatedRoute,
    private playlistService: PlaylistService,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const spotifyPlaylistId: any =
      this.route.snapshot.paramMap.get('spotifyPlaylistId');
    try {
      this.playlist = await this.playlistService.getPlaylistBySpotifyId(
        spotifyPlaylistId,
        false
      );
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }

    socket.on('voteCountUpdated', async ({ playlistId }) => {
      this.playlist = await this.playlistService.getPlaylistBySpotifyId(
        playlistId,
        false
      );
      await this.playlistService.markTracksAsPlayed(spotifyPlaylistId!);
      await this.playlistService.updatePlaylistOrder(spotifyPlaylistId!);

      this.changeDetector.detectChanges();
    });
    socket.on('TrackListUpdated', async ({ playlistId }) => {
      this.playlist = await this.playlistService.getPlaylistBySpotifyId(
        playlistId,
        false
      );

      this.changeDetector.detectChanges();
    });
    socket.on('stateChange', async ({ playlistId }) => {
      await this.playlistService.markTracksAsPlayed(spotifyPlaylistId!);
      await this.playlistService.updatePlaylistOrder(spotifyPlaylistId!);
      this.playlist = await this.playlistService.getPlaylistBySpotifyId(
        playlistId,
        false
      );
      this.changeDetector.detectChanges();
    });
  }

  async fetchPlaylistBySpotifyId(spotifyPlaylistId: string): Promise<void> {
    try {
      this.playlist = await this.playlistService.getPlaylistBySpotifyId(
        spotifyPlaylistId,
        false
      );
    } catch (error) {
      console.error('Failed to fetch playlist', error);
    }
  }

  async vote(trackId: string, spotifyId: string, index: number): Promise<void> {
    try {
      const spotifyPlaylistId =
        this.route.snapshot.paramMap.get('spotifyPlaylistId');
      if (this.userVotes[index]) {
        await this.playlistService.deleteVote(
          spotifyPlaylistId!,
          trackId,
          spotifyId
        );
      } else {
        await this.playlistService.voteForTrack(
          spotifyPlaylistId!,
          trackId,
          spotifyId
        );
      }
      socket.emit('voteUpdated', { playlistId: spotifyPlaylistId, trackId });
    } catch (error) {
      console.error('Failed to vote for track', error);
    }
  }

  async addTrack(): Promise<void> {
    this.addTrackVisible = true;
  }

  async onAddTrackModalClose(searchResult: string | null): Promise<void> {
    this.addTrackVisible = false;

    if (searchResult) {
      const spotifyPlaylistId =
        this.route.snapshot.paramMap.get('spotifyPlaylistId');
      try {
        await this.playlistService.addTrackToPlaylist(
          spotifyPlaylistId!,
          searchResult
        );
        socket.emit('trackAdded', {
          playlistId: spotifyPlaylistId,
          searchResult,
        });
        this.playlist = await this.playlistService.updatePlaylistOrder(
          spotifyPlaylistId!
        );

        await this.fetchPlaylistBySpotifyId(spotifyPlaylistId!);
      } catch (error) {
        console.error('Failed to add track to playlist', error);
      }
    }
  }

  async copyUrlToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard');
    } catch (error) {
      console.error('Failed to copy URL', error);
      alert('Failed to copy URL');
    }
  }
}
