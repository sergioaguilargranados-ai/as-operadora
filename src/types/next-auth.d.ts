import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string;
            role?: string;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        image?: string;
        role?: string;
        emailVerified?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        name: string;
        picture?: string;
        role?: string;
        provider?: string;
    }
}
