

export default function extractUsername(ctx) {
    return ctx.user?.email ?? ctx.user?.username ?? 'unknown'
}
