import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
    publicRoutes: ['/api/webhook/clerk'],
    ignoredRoutes: ['/api/webhook/clerk'],
    debug: true
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
