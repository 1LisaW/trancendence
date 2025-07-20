import sqlite3 from "sqlite3";
import { execute, fetchFirst, fetchAll } from "./sql";
import { GoogleUserDTO } from "./google-models";

export const initGoogleAuthDB = async () => {
  const db = new sqlite3.Database("/db/users.db");
  try {
    // Check if google_id column exists
    const tableInfo = await fetchFirst(db, "PRAGMA table_info(users)", []);
    
    try {
      await execute(db, `ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE`);
      console.log("Added google_id column to users table");
    } catch (error) {
      // Column might already exist, ignore error
      console.log("Google ID column already exists or table doesn't exist yet");
    }
  } catch (error) {
    console.error('Error initializing Google auth DB:', error);
  } finally {
    db.close();
  }
};

export const createUserWithGoogle = async (googleId: string, username: string, email: string, avatar?: string): Promise<GoogleUserDTO | null> => {
  const db = new sqlite3.Database("/db/users.db");
  try {
    // Check if user already exists with this Google ID
    const existingUser = await fetchFirst(db, 
      "SELECT * FROM users WHERE google_id = ?", 
      [googleId]
    ) as GoogleUserDTO;
    
    if (existingUser) {
      return existingUser;
    }
    
    // Check if user exists with this email
    const existingEmail = await fetchFirst(db, 
      "SELECT * FROM users WHERE email = ?", 
      [email]
    ) as GoogleUserDTO;
    
    if (existingEmail) {
      // Update existing user with Google ID (don't change username)
      await execute(db, 
        "UPDATE users SET google_id = ? WHERE email = ?", 
        [googleId, email]
      );
      
      // Update profile with Google avatar if provided
      if (avatar) {
        await execute(db, 
          "UPDATE profiles SET avatar = ? WHERE user_id = ?", 
          [avatar, existingEmail.id.toString()]
        );
      }
      
      // Return updated user
      const updatedUser = await fetchFirst(db, 
        "SELECT * FROM users WHERE email = ?", 
        [email]
      ) as GoogleUserDTO;
      
      return updatedUser;
    }
    
    // Create new user with selected username
    await execute(db, 
      "INSERT INTO users (google_id, name, email, password) VALUES (?, ?, ?, ?)", 
      [googleId, username, email, 'google_oauth_user']
    );
    
    const newUser = await fetchFirst(db, 
      "SELECT * FROM users WHERE google_id = ?", 
      [googleId]
    ) as GoogleUserDTO;
    
    // Create profile for new user with proper error handling
    if (newUser) {
      try {
        // Check if profile already exists
        const existingProfile = await fetchFirst(db, 
          "SELECT * FROM profiles WHERE user_id = ?", 
          [newUser.id.toString()]
        );
        
        if (!existingProfile) {
          await execute(db, 
            "INSERT INTO profiles (user_id, avatar, phone) VALUES (?, ?, ?)", 
            [newUser.id.toString(), avatar || '', '']
          );
          console.log(`Created profile for Google user ${newUser.id}`);
        } else {
          console.log(`Profile already exists for Google user ${newUser.id}`);
        }
      } catch (profileError) {
        console.error('Error creating profile for Google user:', profileError);
        // Create profile even if there's an error? 
        try {
          await execute(db, 
            "INSERT INTO profiles (user_id, avatar, phone) VALUES (?, ?, ?)", 
            [newUser.id.toString(), avatar || '', '']
          );
          console.log(`Created fallback profile for Google user ${newUser.id}`);
        } catch (fallbackError) {
          console.error('Failed to create fallback profile:', fallbackError);
        }
      }
    }
    
    return newUser;
  } catch (error) {
    console.error('Error creating user with Google:', error);
    throw error;
  } finally {
    db.close();
  }
};

export const getUserByGoogleId = async (googleId: string): Promise<GoogleUserDTO | null> => {
  const db = new sqlite3.Database("/db/users.db");
  try {
    return await fetchFirst(db, 
      "SELECT * FROM users WHERE google_id = ?", 
      [googleId]
    ) as GoogleUserDTO;
  } catch (error) {
    console.error('Error getting user by Google ID:', error);
    throw error;
  } finally {
    db.close();
  }
};

export const getUserByEmail = async (email: string): Promise<GoogleUserDTO | null> => {
  const db = new sqlite3.Database("/db/users.db");
  try {
    return await fetchFirst(db, 
      "SELECT * FROM users WHERE email = ?", 
      [email]
    ) as GoogleUserDTO;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  } finally {
    db.close();
  }
};

export const getUserByName = async (name: string): Promise<GoogleUserDTO | null> => {
  const db = new sqlite3.Database("/db/users.db");
  try {
    return await fetchFirst(db, 
      "SELECT * FROM users WHERE name = ?", 
      [name]
    ) as GoogleUserDTO;
  } catch (error) {
    console.error('Error getting user by name:', error);
    throw error;
  } finally {
    db.close();
  }
};
 