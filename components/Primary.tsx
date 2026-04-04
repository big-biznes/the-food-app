import { StyleSheet, Pressable, Text } from 'react-native';
type PrimaryProps = {
    text: string;
    onPress: () => void;
}
export function Primary(props: PrimaryProps) {
    return (
        <Pressable
            style={styles.button}
            onPress={props.onPress}>
            <Text style={styles.text}>{props.text}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'orange',  
        margin: 4,
        elevation: 5,
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
        color: 'white',
    },
});
