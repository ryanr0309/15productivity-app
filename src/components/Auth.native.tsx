import { Button, Platform, Pressable } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '../lib/supabase'
import React from 'react'

export function AuthApple() {
  if (Platform.OS === 'ios')
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 200, height: 64 }}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            })
            // Sign in via Supabase Auth.
            if (credential.identityToken) {
              const {
                error,
                data: { user },
              } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
              })
              console.log(JSON.stringify({ error, user }, null, 2))
              if (!error) {
                // Apple only provides the user's full name on the first sign-in
                // Save it to user metadata if available
                if (credential.fullName) {
                  const nameParts = []
                  if (credential.fullName.givenName) nameParts.push(credential.fullName.givenName)
                  if (credential.fullName.middleName) nameParts.push(credential.fullName.middleName)
                  if (credential.fullName.familyName) nameParts.push(credential.fullName.familyName)

                  const fullName = nameParts.join(' ')

                  await supabase.auth.updateUser({
                    data: {
                      full_name: fullName,
                      given_name: credential.fullName.givenName,
                      family_name: credential.fullName.familyName,
                    }
                  })
                }
                // User is signed in.
              }
            } else {
              throw new Error('No identityToken.')
            }
          } catch (e) {
            if (e instanceof Error) {
    console.log(e.message);
  } else {
    console.log(e);
  }
          }
        }}
      />
    )
  return (
    <>
      {/*
        On Android, Sign in with Apple is not natively supported.
        You have two options:
        1. Use the OAuth flow via signInWithOAuth (see Flutter Android example below)
        2. Use a web-based solution like react-native-app-auth

        For most cases, we recommend using the OAuth flow:
      */}
      <Pressable
        onPress={async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: 'your-app-scheme://auth/callback',
              skipBrowserRedirect: false,
            },
          })
          if (error) {
            console.error('Sign in error:', error)
          }
        }}
      >
        Sign in with Apple
      </Pressable>
    </>
  )
}