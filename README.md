# PlanetQAi - AI-Powered Music Generation Platform

![PlanetQAi Logo](/public/images/logo.png)

PlanetQAi is a comprehensive platform that combines AI music generation, video content, and interactive features to create a unique digital experience. The platform allows users to generate AI music using different models, manage credits, and access various multimedia content through an intuitive interface.

## 🚀 Features

### 🎵 AI Music Generation
- **Multiple AI Models**: Generate music using Diffrhym and Suno AI models
- **Customizable Parameters**: Control style, mood, and other aspects of music generation
- **Credit System**: Pay-per-generation using a flexible credit system

### 🎮 Interactive UI
- **Swipeable Cards**: Tinder-like card interface for navigating between different sections
- **Responsive Design**: Optimized for all device sizes
- **Animated Elements**: Engaging animations and transitions

### 💳 Payment & Credits
- **Stripe Integration**: Secure payment processing for credit purchases
- **Subscription Plans**: Various subscription tiers with different benefits
- **Credit Management**: Track and manage user credits for various actions

### 🔐 User Authentication
- **Next-Auth Integration**: Secure authentication system
- **User Profiles**: Personalized user experiences
- **Role-Based Access**: Different permissions for different user types

### 📱 Media Content
- **Video Player**: Custom video player for Planet Q content
- **Radio Integration**: Stream Planet Q Radio directly in the app
- **Gallery**: Browse and manage generated content

## 🏗️ Project Structure

### Core Components

#### Frontend
- **`/app`**: Main application pages and layouts using Next.js App Router
  - `/page.jsx`: Landing page with swipeable cards
  - `/payment`: Subscription and credit purchase page
  - `/studio`: Music generation studio
  - `/gallery`: User's generated content

- **`/components`**: Reusable UI components
  - `/player`: Music player and generation components
    - `DiffrhymGenerator.js`: Interface for Diffrhym AI model
    - `SunoGenerator.js`: Interface for Suno AI model
  - `/credits`: Credit management components
  - `/ui`: General UI components

#### Backend (API Routes)
- **`/app/api`**: Server-side API endpoints
  - `/music`: Music generation endpoints
    - `/generate`: Diffrhym generation endpoint
    - `/generate-suno`: Suno generation endpoint
  - `/credits`: Credit management endpoints
  - `/subscriptions`: Stripe subscription management
  - `/auth`: Authentication endpoints

#### Utilities
- **`/lib`**: Utility functions and shared logic
  - `credit-stripe-utils.js`: Credit calculation and management
  - `auth.js`: Authentication configuration
  - `prisma.js`: Database client

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **AI Integration**: Custom APIs for Diffrhym and Suno
- **Deployment**: Vercel/Netlify

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Stripe account for payment processing

### Environment Variables
Create a `.env.local` file with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/planetqai"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# AI Services
DIFFRHYM_API_KEY=your-diffrhym-key
SUNO_API_KEY=your-suno-key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/planetqai.git
cd planetqai

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📊 Credit System

The platform uses a credit-based system for AI music generation:

- **Base Credits**: Each user starts with a set number of free credits
- **Credit Calculation**: 
  - Diffrhym: 50 credits base + 4 credits per 10 words over 200
  - Suno: 80 credits base + 5 credits per 10 words over 200
- **Credit Purchase**: Users can purchase additional credits through the Stripe integration

## 🔄 Deployment

The application is optimized for deployment on Vercel or similar platforms:

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Planet Q Productions Team

## 📞 Support

For support, email support@planetqproductions.com or visit our website at [planetqproductions.com](https://planetqproductions.com).

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
