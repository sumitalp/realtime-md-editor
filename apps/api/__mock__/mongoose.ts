// import { jest } from '@jest/globals';
// import * as mongoose from 'mongoose';
//
// // Access the real ObjectId from Mongoose to preserve its properties
// const actualMongoose = jest.requireActual<typeof mongoose>('mongoose');
//
// // Define a type for our mocked ObjectId to ensure type safety.
// type MockedObjectId = mongoose.Types.ObjectId & {
//   _id: string;
// };
//
// // Mock the ObjectId constructor to use a dynamic string.
// (actualMongoose.Types.ObjectId as jest.Mocked<any>) = jest.fn((id?: mongoose.Types.ObjectId | string) => {
//   // If an ID is provided, use that. Otherwise, generate a real ObjectId hex string.
//   const value = id ? String(id) : new actualMongoose.Types.ObjectId().toHexString();
//
//   // Create a mock object that implements the necessary methods.
//   const objectId = {
//     toString: () => value,
//     equals: (other: any) => String(other) === value,
//     toHexString: () => value,
//     _id: value,
//   };
//
//   // Assign our custom object to a real ObjectId instance to pass Mongoose's internal checks.
//   return Object.assign(new actualMongoose.Types.ObjectId(), objectId) as MockedObjectId;
// });
//
// module.exports = actualMongoose;
