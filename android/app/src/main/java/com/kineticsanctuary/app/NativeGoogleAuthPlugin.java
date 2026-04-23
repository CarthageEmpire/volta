package com.kineticsanctuary.app;

import android.app.Activity;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void signIn(PluginCall call) {
        String webClientId = call.getString("webClientId");
        if (webClientId == null || webClientId.trim().isEmpty()) {
            call.reject("Missing VITE_FIREBASE_GOOGLE_WEB_CLIENT_ID. Add your Firebase web client ID to .env.local.");
            return;
        }

        GoogleSignInOptions options = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestIdToken(webClientId.trim())
            .build();

        googleSignInClient = GoogleSignIn.getClient(getActivity(), options);

        boolean forcePrompt = Boolean.TRUE.equals(call.getBoolean("forcePrompt", true));
        if (forcePrompt) {
            googleSignInClient
                .signOut()
                .addOnCompleteListener(getActivity(), task -> launchSignIn(call))
                .addOnFailureListener(error -> call.reject("Unable to reset previous Google session.", error));
            return;
        }

        launchSignIn(call);
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        if (googleSignInClient == null) {
            call.resolve();
            return;
        }

        googleSignInClient
            .signOut()
            .addOnCompleteListener(getActivity(), task -> call.resolve())
            .addOnFailureListener(error -> call.reject("Unable to sign out from Google.", error));
    }

    private void launchSignIn(PluginCall call) {
        if (googleSignInClient == null) {
            call.reject("Google Sign-In client is not initialized.");
            return;
        }

        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, "handleGoogleSignInResult");
    }

    @ActivityCallback
    private void handleGoogleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Intent data = result.getData();
        if (data == null && result.getResultCode() != Activity.RESULT_OK) {
            call.reject("Google sign-in was cancelled.");
            return;
        }

        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);

        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account == null) {
                call.reject("Google sign-in returned no account.");
                return;
            }

            String idToken = account.getIdToken();
            if (idToken == null || idToken.trim().isEmpty()) {
                call.reject(
                    "Google sign-in did not return an ID token. Verify your Firebase Android app, SHA fingerprint, and web client ID."
                );
                return;
            }

            JSObject response = new JSObject();
            response.put("idToken", idToken);
            response.put("email", account.getEmail());
            response.put("displayName", account.getDisplayName());
            response.put("familyName", account.getFamilyName());
            response.put("givenName", account.getGivenName());
            response.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
            call.resolve(response);
        } catch (ApiException error) {
            call.reject(mapGoogleSignInError(error.getStatusCode()), String.valueOf(error.getStatusCode()), error);
        }
    }

    private String mapGoogleSignInError(int statusCode) {
        if (statusCode == GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
            return "Google sign-in was cancelled.";
        }

        if (statusCode == GoogleSignInStatusCodes.SIGN_IN_CURRENTLY_IN_PROGRESS) {
            return "Another Google sign-in is already in progress.";
        }

        if (statusCode == GoogleSignInStatusCodes.SIGN_IN_FAILED) {
            return "Google sign-in failed before Firebase could receive a token. Check Google Play Services and try again.";
        }

        if (statusCode == CommonStatusCodes.DEVELOPER_ERROR) {
            return "Google sign-in configuration is invalid. Verify the Android SHA fingerprint, package name, and VITE_FIREBASE_GOOGLE_WEB_CLIENT_ID.";
        }

        if (statusCode == CommonStatusCodes.NETWORK_ERROR) {
            return "Google sign-in failed because the device could not reach Google services.";
        }

        return "Google sign-in failed with status " + statusCode + ".";
    }
}
