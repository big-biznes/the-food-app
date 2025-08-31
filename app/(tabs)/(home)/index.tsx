import { Link, useRouter } from "expo-router";
import { View, Button, Text, StyleSheet } from 'react-native';
import { useState } from "react";

export default function HomeScreen() {
    const arr = ["One", "Two", "Three"]
    const [index, setIndex] = useState(0)
    const router = useRouter();
    return (
        <View style={styles.container}>
            <Text>Home</Text>
            <View style={styles.buttons}>
                <View style={styles.button} >
                    <Button
                        title="Increase"
                        onPress={() => index >= 2 ? setIndex(0) : setIndex(index + 1)} />
                </View>
                <View style={styles.button} >
                    <Button title="Decrease" onPress={() => index <= 0 ? setIndex(2) : setIndex(index - 1)} />
                </View>
            </View>
            <Text>{arr[index]}</Text>
            <Link href="/details">View details</Link>
            <Button title="Go Details" onPress={() => router.navigate('/details')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttons: {
        flexDirection: "row",
        gap: 12
    },
    button: {
    }
});

