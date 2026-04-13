# Expenny

Expenny is a subscription tracking web app built with Next.js, React, and Firebase.

The goal of the project is to help users keep track of recurring subscriptions, understand where their money is going, and spot opportunities to save. Users can create an account, log in with Firebase Authentication, store subscription data in Firestore, and manage everything from a single dashboard.

## What The App Does

Expenny lets a user:

- create an account and log in with Firebase Auth
- add, edit, and delete subscriptions
- view upcoming bills
- search, filter, and sort subscription data
- review analytics like monthly spend, yearly spend, top category, and potential savings
- import subscriptions from CSV
- export subscriptions to CSV

## Features

### Core Features

- Firebase email/password authentication
- Firestore-backed subscription storage
- subscription form with edit support
- subscription status tracking
- billing frequency tracking
- trial and reminder fields

### Dashboard Features

- monthly and yearly spending analytics
- top spending category breakdown
- most expensive subscription summary
- upcoming bills section
- empty states and loading states
- toast feedback for dashboard actions

### Data Tools

- CSV import
- CSV export
- sample CSV data in `public/sample-subscriptions.csv`

### App Enhancements

- responsive layout
- landing page
- privacy and terms pages
- PWA manifest setup

## Tech Stack

- Next.js 15
- React 19
- Firebase Authentication
- Firestore
- CSS with custom styles and `fanta.css`

## Project Structure

```text
app/
  dashboard/
    page.js             # main authenticated dashboard page
  privacy/page.js       # privacy page
  tos/page.js           # terms page
  globals.css           # app-specific styling
  layout.js             # shared app layout
  manifest.js           # PWA manifest

components/
  DashboardToolbar.jsx  # search, filter, sort, import/export controls
  Hero.jsx              # landing page hero section
  Login.jsx             # login and signup UI
  SubscriptionForm.jsx  # add/edit subscription form
  SubscriptionSummary.jsx
  SubscriptionsDisplay.jsx
  UpcomingBills.jsx
  Toast.jsx

context/
  AuthContext.jsx       # shared Firebase auth + Firestore subscription state

utils/
  index.js              # normalization, analytics, billing, CSV helpers

firebase.js             # Firebase app configuration
```

## How Authentication Works

The project uses Firebase email/password authentication.

The auth logic lives in `context/AuthContext.jsx`. That file:

- signs users up with `createUserWithEmailAndPassword`
- logs users in with `signInWithEmailAndPassword`
- logs users out with `signOut`
- loads each user’s subscription data from Firestore
- keeps the app’s auth and subscription state available through React Context

## How Subscription Data Works

Each logged-in user has a Firestore document in the `users` collection.

That document stores a `subscriptions` array. Each subscription is normalized before being saved so it has a consistent shape, including fields like:

- `id`
- `name`
- `category`
- `cost`
- `currency`
- `billingFrequency`
- `paymentMethod`
- `startDate`
- `renewalType`
- `trialEndDate`
- `status`
- `alertBeforeDays`
- `notes`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add your environment variables

Create a `.env` file in the project root with your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_APIKEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTHDOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECTID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGEBUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APPID=your_app_id
```

### 3. Make sure Firebase is configured

In your Firebase project:

- enable Email/Password authentication
- create a Firestore database
- make sure your app settings match the values in `.env`

### 4. Run the app

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Sample Test Data

To test the dashboard quickly, import:

```text
public/sample-subscriptions.csv
```

This sample file includes:

- active subscriptions
- paused subscriptions
- cancelled subscriptions
- yearly and monthly billing
- a trial subscription

## Recent Upgrades

This version of Expenny includes several improvements over the earlier version:

- real edit/update flow instead of delete-and-recreate
- stronger analytics and category breakdowns
- upcoming bills tracking
- import/export support
- improved landing page and dashboard styling
- beginner-friendly comments added through important logic files

## Possible Future Improvements

- charts and visual spending trends
- real reminder notifications
- dark mode
- shared/family subscription support
- multi-currency conversion
- subscription usage tracking

## Author

Built by Khamosh Mehta.
