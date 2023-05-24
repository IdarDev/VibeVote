import '../config/passport';
import spotifyApi from '../config/spotify';

const getAuthTokens = (req: any, res: any) => {
  const { accessToken, refreshToken, expires_in }: any = req.user;

  res.redirect(
    `https://vibevote.netlify.app/home?accessToken=${accessToken}&refreshToken=${refreshToken}&expiresIn=${expires_in}`
  );
};

const refreshAuthTokens = async (req: any, res: any) => {
  const refreshToken = req.body.refresh_token;

  try {
    spotifyApi.setRefreshToken(refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    const newAccessToken = data.body['access_token'];
    const expiresIn = data.body['expires_in'];
    const expiresAt = Date.now() + expiresIn * 1000;

    res.json({ access_token: newAccessToken, expires_in: expiresIn });
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    res.status(500).json({ error: 'Failed to refresh access token' });
  }
};

export default { getAuthTokens, refreshAuthTokens };
