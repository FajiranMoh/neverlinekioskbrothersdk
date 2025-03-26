import React, {useState, useEffect} from 'react';
import {View, Text, Button, PermissionsAndroid, Platform} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

const App = () => {
  const [manager, setManager] = useState<BleManager | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [foundDevices, setFoundDevices] = useState<Device[]>([]);

  useEffect(() => {
    const bleManager = new BleManager();
    setManager(bleManager);

    // Request Bluetooth permissions on Android
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH)
        .then(() =>
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          ),
        )
        .then(() =>
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ),
        );
    }

    return () => {
      // Cleanup manager on unmount
      bleManager.destroy();
    };
  }, []);

  const scanForDevices = () => {
    if (manager && !scanning) {
      setScanning(true);
      setFoundDevices([]);
      manager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.log(error);
          return;
        }
        // Filter by device name (Brother QL-820NWBC)
        if (scannedDevice?.name === 'Brother QL-820NWBC') {
          setFoundDevices(prevDevices => [...prevDevices, scannedDevice]);
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        manager.stopDeviceScan();
        setScanning(false);
      }, 10000);
    }
  };

  const connectToDevice = (device: Device) => {
    device
      .connect()
      .then(connectedDevice => {
        setDevice(connectedDevice);
        setIsConnected(true);
        console.log('Connected to printer:', connectedDevice.name);
      })
      .catch(error => {
        console.log('Connection error:', error);
      });
  };

  const disconnectFromDevice = () => {
    if (device) {
      device
        .cancelConnection()
        .then(() => {
          setIsConnected(false);
          setDevice(null);
          console.log('Disconnected from printer');
        })
        .catch(error => {
          console.log('Disconnection error:', error);
        });
    }
  };

  const printData = () => {
    if (device) {
      // Create print data in ESC/POS or your required format
      const printCommand = Buffer.from('Your print data in the correct format');
      // Replace with the correct service and characteristic UUIDs for your printer
      const serviceUUID = 'serviceUUID'; // Replace with your printer's service UUID
      const characteristicUUID = 'characteristicUUID'; // Replace with your printer's characteristic UUID
      device
        .writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          printCommand.toString('base64'),
        )
        .then(response => {
          console.log('Print success', response);
        })
        .catch(error => {
          console.log('Print error', error);
        });
    }
  };

  return (
    <View>
      <Text>{isConnected ? 'Connected to Printer' : 'Not Connected'}</Text>
      <Button title="Scan for Devices" onPress={scanForDevices} />
      {scanning && <Text>Scanning for devices...</Text>}
      {foundDevices.length > 0 && !isConnected && (
        <View>
          <Text>Found Printers:</Text>
          {foundDevices.map(foundDevice => (
            <Button
              key={foundDevice.id}
              title={`Connect to ${foundDevice.name}`}
              onPress={() => connectToDevice(foundDevice)}
            />
          ))}
        </View>
      )}
      {isConnected && (
        <View>
          <Button title="Print Data" onPress={printData} />
          <Button title="Disconnect" onPress={disconnectFromDevice} />
        </View>
      )}
    </View>
  );
};

export default App;
