import { Redirect } from 'expo-router';

export default function Index() {
    // Redirect immediately to the tabs
    return <Redirect href="/(tabs)" />;
}
