import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Button,
  View,
  Alert,
  Platform,
  ScrollView, // Added for better layout
} from 'react-native';
import Net, {Socket} from 'react-native-tcp-socket';
import {Buffer} from 'buffer'; // Import Buffer

// Default Port for Brother Raw TCP printing
const PRINTER_PORT = 9100;

const App = () => {
  const [printerIp, setPrinterIp] = useState<string>(''); // Store printer IP
  const [status, setStatus] = useState<string>('Idle');
  const [textToPrint, setTextToPrint] = useState<string>('Hello\nReact Native'); // Added state for text

  const printLabel = () => {
    if (!printerIp) {
      Alert.alert('Error', 'Please enter the printer IP address.');
      return;
    }
    if (!textToPrint) {
      Alert.alert('Error', 'Please enter text to print.');
      return;
    }

    setStatus(`Connecting to ${printerIp}:${PRINTER_PORT}...`);

    let client: Socket | null = null;

    try {
      client = Net.createConnection(
        {
          host: printerIp,
          port: PRINTER_PORT,
        },
        () => {
          setStatus('Connected. Sending data...');
          console.log('Connection established!');

          // --- Construct Print Commands (VERY Basic Example) ---

          // 1. Initialize Printer
          const initCmd = Buffer.from([0x1b, 0x40]); // ESC @

          // 2. Text Data (ensure ASCII or compatible encoding if printer requires)
          // NOTE: Newlines (\n) might work for simple line breaks on some models/modes.
          // Proper text formatting (font, size, style) requires specific ESC/P commands.
          const textData = Buffer.from(textToPrint + '\n', 'ascii'); // Ensure newline at end if needed

          // 3. Form Feed (Print and Cut)
          const formFeedCmd = Buffer.from([0x0c]); // FF

          // Combine commands
          const printCommands = Buffer.concat([initCmd, textData, formFeedCmd]);

          // --- Send Commands ---
          if (client) {
            client.write(printCommands, err => {
              if (err) {
                const errorMsg = `Error sending data: ${err.message}`;
                console.error(errorMsg);
                setStatus(errorMsg);
                Alert.alert('Send Error', errorMsg);
                // Close connection on error too
                client?.destroy();
              } else {
                setStatus('Data sent. Closing connection.');
                console.log('Data sent successfully');
                // Close the connection gracefully after sending
                client?.end();
              }
            });
          }
        },
      );

      // --- Socket Event Handlers ---

      client.on('error', error => {
        const errorMsg = `Connection Error: ${error.message}`;
        console.error(errorMsg);
        setStatus(errorMsg);
        Alert.alert('Connection Error', errorMsg);
        client?.destroy(); // Ensure socket is destroyed on error
        client = null;
      });

      client.on('close', hadError => {
        setStatus(
          `Connection closed ${hadError ? 'due to error' : 'gracefully'}.`,
        );
        console.log('Connection closed. Had error:', hadError);
        client = null; // Clear reference
      });

      // Optional: Timeout for connection attempt
      client.setTimeout(5000, () => {
        setStatus('Connection timed out.');
        Alert.alert(
          'Timeout',
          'Could not connect to the printer within 5 seconds.',
        );
        client?.destroy();
        client = null;
      });
    } catch (error: any) {
      const errorMsg = `Failed to create connection: ${
        error?.message || error
      }`;
      console.error(errorMsg);
      setStatus(errorMsg);
      Alert.alert('Setup Error', errorMsg);
      if (client) {
        client.destroy(); // Clean up if connection object was created but failed later
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Brother QL Printer Test</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Printer IP Address:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 192.168.1.100"
            value={printerIp}
            onChangeText={setPrinterIp}
            keyboardType="numeric" // More specific keyboard
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Text to Print:</Text>
          <TextInput
            style={[styles.input, styles.textArea]} // Style for multi-line
            placeholder="Enter text here..."
            value={textToPrint}
            onChangeText={setTextToPrint}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <Button title="Print Label" onPress={printLabel} />

        <Text style={styles.status}>Status: {status}</Text>

        <Text style={styles.warning}>
          Note: This example sends very basic text commands. Printing complex
          layouts, fonts, barcodes, or images requires generating specific
          'raster' data for the printer, which is significantly more complex.
          Refer to the Brother ESC/P or Raster command reference for details.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center', // Center items horizontally
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%', // Take full width
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 45, // Slightly taller input
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5, // Rounded corners
    width: '100%', // Take full width
    backgroundColor: '#fff', // White background
  },
  textArea: {
    height: 100, // Taller for multi-line
    textAlignVertical: 'top', // Align text to top for multiline
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: 'navy',
  },
  warning: {
    marginTop: 30,
    fontSize: 12,
    fontStyle: 'italic',
    color: 'grey',
    textAlign: 'center',
  },
});

export default App;
