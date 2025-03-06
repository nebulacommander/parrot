import React from 'react';
import Link from 'next/link';
export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <Link 
                href="/sign-in" 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Sign In
            </Link>
        </main>
    );
}
