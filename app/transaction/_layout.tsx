import { Stack } from 'expo-router/stack';

export default function TransactionLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="new" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
