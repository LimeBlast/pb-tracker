# PB Tracker

A GitHub Pages web app that fetches your Strava running data and displays personal bests for 1 Mile, 5K, 10K, Half Marathon, and Marathon — with improvement charts and yearly breakdowns.

## Setup

### 1. Enable GitHub Pages

In your repository settings → **Pages**, set the source to **GitHub Actions**.

### 2. Create a Strava API Application

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application (any name/website is fine for personal use)
3. Note your **Client ID** and **Client Secret**
4. Set the **Authorization Callback Domain** to `localhost`

### 3. Get a Refresh Token

Run these commands, replacing `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET`:

**Step 1 — Open this URL in your browser** (replace `YOUR_CLIENT_ID`):
```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
```

Authorise the app. You'll be redirected to `http://localhost/?code=XXXX` — copy the `code` value.

**Step 2 — Exchange the code for tokens**:
```bash
curl -X POST https://www.strava.com/oauth/token \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F code=YOUR_CODE \
  -F grant_type=authorization_code
```

Copy the `refresh_token` from the response.

### 4. Add GitHub Secrets

In your repository settings → **Secrets and variables → Actions**, add:

| Secret name             | Value                        |
|-------------------------|------------------------------|
| `STRAVA_CLIENT_ID`      | Your Strava client ID        |
| `STRAVA_CLIENT_SECRET`  | Your Strava client secret    |
| `STRAVA_REFRESH_TOKEN`  | The refresh token from above |

### 5. Fetch Your Data

Go to **Actions → Update Strava Data → Run workflow**.

This fetches all your running activities from Strava, extracts best efforts for each target distance, and commits `public/data/pbs.json`. The deploy workflow then builds and publishes the site automatically.

On first run it may take a while (it fetches details for every run you've ever logged). Subsequent runs only process new activities.

## Data Refresh Schedule

The data workflow runs automatically every **Monday at 06:00 UTC**. You can also trigger it manually via the Actions tab.

## Local Development

```bash
npm install
npm run dev
```

The app loads `public/data/pbs.json` locally. If it's empty, run the fetch script locally:

```bash
export STRAVA_CLIENT_ID=...
export STRAVA_CLIENT_SECRET=...
export STRAVA_REFRESH_TOKEN=...
pip install requests
python scripts/fetch_strava_data.py
```
