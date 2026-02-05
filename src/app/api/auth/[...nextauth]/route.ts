/**
 * NEXTAUTH API ROUTE
 * Endpoint de autenticación de NextAuth
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
