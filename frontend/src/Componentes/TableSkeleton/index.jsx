import { Box, Paper, Skeleton, Stack } from "@mui/material";

export default function TableSkeleton({ rows = 6, height = 48 }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%' }}>
            {/* Header Skeleton */}
            <Stack direction="row" spacing={2} sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton variant="text" width="15%" height={32} />
                <Skeleton variant="text" width="30%" height={32} />
                <Skeleton variant="text" width="20%" height={32} />
                <Skeleton variant="text" width="15%" height={32} />
                <Skeleton variant="text" width="20%" height={32} />
            </Stack>

            {/* Row Skeletons */}
            <Stack spacing={1.5}>
                {Array.from({ length: rows }).map((_, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            py: 0.5,
                        }}
                    >
                        <Skeleton variant="rounded" width="15%" height={height * 0.6} />
                        <Skeleton variant="rounded" width="30%" height={height * 0.6} />
                        <Skeleton variant="rounded" width="20%" height={height * 0.6} />
                        <Skeleton variant="rounded" width="15%" height={height * 0.6} />
                        <Skeleton variant="rounded" width="20%" height={height * 0.6} />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
