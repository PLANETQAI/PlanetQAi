import React from 'react';
import { Metadata } from 'next';
import VerifyAccountForm from '@/components/auth/verifyAccountForm';

export const metadata = {
  title: 'Verify Account | PlanetQAi',
  description: 'Verify your PlanetQAi account to get started.',
};

export default function VerifyAccountPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Verify Your Account
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Enter the verification code sent to your email
          </p>
        </div>
        <VerifyAccountForm />
      </div>
    </div>
  );
}
