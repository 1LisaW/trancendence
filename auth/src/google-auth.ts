import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createUserWithGoogle, getUserByGoogleId } from './google-sqlite';
import { getUserByEmail, getUserByName } from './sqlite'; // Import from regular sqlite
import { GoogleAuthRequestBody, GoogleAuthResponse } from './google-models';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const handleGoogleAuth = async (requestBody: GoogleAuthRequestBody): Promise<GoogleAuthResponse> => {
  try {
    const { idToken } = requestBody;
    
    if (!idToken) {
      return { error: 'ID token is required' };
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return { error: 'Invalid Google token' };
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return { error: 'Email not verified with Google' };
    }

    if (!email || !name) {
      return { error: 'Invalid user data from Google' };
    }

    // Check if user already exists with this Google ID
    const existingUser = await getUserByGoogleId(googleId);
    
    if (existingUser) {
      // User exists, return token directly
      const token = jwt.sign(
        { userId: existingUser.id }, 
        process.env.TOKEN_SECRET || "", 
        { expiresIn: '1h' }
      );

      return {
        token,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          avatar: existingUser.avatar
        }
      };
    }

    // Check if email exists but no Google ID
    const existingEmail = await getUserByEmail(email);
    
    if (existingEmail) {
      // Email exists but no Google ID - update existing user with Google ID
      // This should automatically log them in without asking for username
      const updatedUser = await createUserWithGoogle(googleId, existingEmail.name, email, picture);
      
      if (updatedUser) {
        const token = jwt.sign(
          { userId: updatedUser.id }, 
          process.env.TOKEN_SECRET || "", 
          { expiresIn: '1h' }
        );

        return {
          token,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar
          }
        };
      }
    }

    // New user - return for username selection
    return {
      needsUsername: true,
      googleUser: {
        sub: googleId,
        email,
        name,
        picture
      }
    };

  } catch (error) {
    console.error('Google auth error:', error);
    return { error: 'Google authentication failed' };
  }
}; 