# PlanetQAi Project Documentation

## Project Overview

PlanetQAi is a comprehensive web application built with Next.js that offers AI-powered music generation and streaming services. The platform combines several key features:

1. **AI Music Studio**: Generate music using AI technology with customizable options
2. **Planet Q Radio**: Live streaming radio service
3. **User Subscription System**: Tiered subscription plans with different features
4. **Credit System**: Virtual currency for generating AI music
5. **Gallery**: Showcase of user-generated content

## Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **3D Visualization**: Three.js (React Three Fiber)
- **Styling**: TailwindCSS with custom animations
- **Media Handling**: React Player, React H5 Audio Player
- **Deployment**: Vercel

## Project Structure

### Core Directories

- `/app`: Next.js app router pages and layouts
- `/components`: Reusable React components
- `/prisma`: Database schema and migrations
- `/lib`: Utility functions and shared code
- `/public`: Static assets
- `/utils`: Helper functions
- `/context`: React context providers

### Key App Routes

- `/`: Landing page with interactive cards
- `/aistudio`: AI music generation studio
- `/chat`: Chat interface for AI assistance
- `/gallery`: Showcase of generated content
- `/login` & `/signup`: Authentication pages
- `/payment`: Subscription management
- `/my-studio`: User's personal workspace
- `/planetqproductions`: Production showcase

### API Routes

- `/api/auth`: Authentication endpoints
- `/api/chat`: AI chat functionality
- `/api/gallery`: Gallery management
- `/api/link`: Video link management
- `/api/payment`: Payment processing
- `/api/subscriptions`: Subscription management
- `/api/user`: User profile management

## Database Schema

The application uses a PostgreSQL database with the following key models:

1. **User**: Core user information, authentication, and subscription status
2. **Subscription**: User subscription details linked to Stripe
3. **Payment**: Payment history and transaction records
4. **CreditLog**: Tracking of credit usage and allocation
5. **Song**: AI-generated music with metadata
6. **Gallery**: Public showcase of content
7. **VideoLinks**: Video content links
8. **PricingPlan/SubscriptionPlan**: Available subscription tiers

## Authentication System

Authentication is implemented using NextAuth.js with a Credentials provider:
- Email/password authentication
- Session management
- Role-based access control (Admin, Premium, Pro, Starter, Basic)
- Secure password hashing with bcrypt

## Subscription System

The application implements a tiered subscription model:
- Multiple subscription tiers (Free, Starter, Pro, Premium)
- Integration with Stripe for payment processing
- Credit allocation based on subscription tier
- Subscription management (upgrade, downgrade, cancel)

## Credit System

Credits serve as the in-app currency for generating content:
- Credits allocated monthly based on subscription tier
- Credits consumed when generating AI music
- Credit usage tracking and history
- Option to purchase additional credits

## Key Features

### AI Music Studio

The AI Studio allows users to:
- Generate music using AI with customizable parameters
- Adjust generation settings for different outputs
- Save and download generated content
- Share creations to the gallery

### Planet Q Radio

A live streaming radio service:
- Continuous music streaming
- Custom audio player interface
- Volume and playback controls

### User Dashboard

Personal workspace for users:
- View subscription status
- Track credit usage
- Manage generated content
- Access subscription management

## Frontend Components

The application uses a component-based architecture with:
- Shared UI components in `/components/ui`
- Feature-specific components organized by functionality
- 3D canvas elements for visual appeal
- Responsive design for all device sizes

## Integration Points

1. **Stripe**: Payment processing and subscription management
2. **AI Services**: Integration with AI models for music generation
3. **Media Storage**: Storage for generated audio and video files
4. **Authentication**: User identity and access management

## Deployment

The application is deployed on Vercel with:
- Production environment at `https://planetqproductions.vercel.app/`
- Database hosted on a PostgreSQL provider
- Environment variables for sensitive configuration

## Development Workflow

1. Local development using `next dev`
2. Database migrations with Prisma
3. Build and deployment through Vercel pipeline
4. Stripe webhook handling for payment events

## Future Enhancements

Potential areas for future development:
1. Enhanced AI generation capabilities
2. Mobile application
3. Social features and community building
4. Additional content types beyond music
5. Advanced analytics for user engagement
