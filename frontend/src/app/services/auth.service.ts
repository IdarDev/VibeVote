import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expirationTime: number | null = null;
  URL = 'https://vibevote-server.fly.dev';

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((params) => {
      if (params['accessToken']) {
        this.accessToken = params['accessToken'];
        localStorage.setItem('accessToken', this.accessToken!);
      }
      if (params['refreshToken']) {
        this.refreshToken = params['refreshToken'];
        localStorage.setItem('refreshToken', this.refreshToken!);
      }
      if (params['expiresIn']) {
        const expiresIn = parseInt(params['expiresIn'], 10);
        this.expirationTime = Date.now() + expiresIn * 1000;
        localStorage.setItem('expirationTime', this.expirationTime.toString());
      }
    });
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('refreshToken');
    }
    if (!this.expirationTime) {
      const expirationTimeString = localStorage.getItem('expirationTime');
      if (expirationTimeString) {
        this.expirationTime = parseInt(expirationTimeString, 10);
      }
    }
  }

  loginWithSpotify() {
    const scope =
      'user-read-email user-read-private playlist-modify-private playlist-modify-public user-read-playback-state streaming';
    const responseType = 'code';
    const authUrl = `https://vibevote-server.fly.dev/auth/spotify?scope=${scope}&response_type=${responseType}`;
    window.location.href = authUrl;
  }

  getAccessToken() {
    return this.accessToken;
  }
  getRefreshToken() {
    return this.refreshToken;
  }
  getExpirationTime() {
    return this.expirationTime;
  }

  isTokenExpired(): boolean {
    if (!this.expirationTime) {
      return true;
    }
    return Date.now() >= this.expirationTime;
  }
  updateAccessToken() {
    this.accessToken = localStorage.getItem('accessToken');
  }

  setAccessToken(accessToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.expirationTime = Date.now() + expiresIn * 1000;
    localStorage.setItem('accessToken', this.accessToken);
    localStorage.setItem('expirationTime', this.expirationTime.toString());
  }

  async refreshAccessToken(refreshToken?: string): Promise<void> {
    try {
      const token = refreshToken || this.getRefreshToken();
      const response: any = await this.http
        .post(`https://vibevote-server.fly.dev/auth/refresh`, {
          refreshToken: token,
        })
        .toPromise();

      const newAccessToken = response['access_token'];
      const expiresIn = response['expires_in'];

      this.setAccessToken(newAccessToken, expiresIn);
    } catch (error) {
      console.error('Failed to refresh access token', error);
      throw error;
    }
  }
}
