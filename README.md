<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/37988578-391f-47b1-8362-ac4d990ed9a7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

Created a one-command Android startup workflow by adding a reusable PowerShell script and npm commands, and verified it works by successfully running the new emulator boot command.

Created.

You now have one-command Android startup commands:

Boot emulator only:
npm run android:boot

Boot emulator + build + sync + install + launch app:
npm run android:run