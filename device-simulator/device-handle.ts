export class DeviceHandle {
    sendMeasurement(value: any) {
        console.log(`Sending measurement: ${JSON.stringify(value)}`);
    }

    updateManagedObject(value: any) {
        console.log(`Updating ManagedObject: ${JSON.stringify(value)}`);
    }
}