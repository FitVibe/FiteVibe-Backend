import mongoose,  { Document, IfAny, Model, RootFilterQuery } from 'mongoose';

export class MongoDBDatabase {
    constructor() {
        this.connect();
    }

    async connect(): Promise<void> {
        try {
            await mongoose.connect(process.env.MONGO_URI, {});
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
        }
    }

    public async query<T extends Document>(
        model: Model<T>,
        filter: RootFilterQuery<T> = {},
        projection: Record<string, unknown> = {},
        options: Record<string, unknown> = {}
    ): Promise<T[] | null> {
        try {
            const result = await model.find(filter, projection, options);
            return result;
        } catch (err) {
            console.error('Error executing query:', err);
            return null;
        }
    }

    public async insert<T extends Document>(model: Model<T>, data: Partial<T>): Promise<T | null> {
        try {
            const document = new model(data);
            await document.save();
            return document;
        } catch (err) {
            console.error('Error inserting data:', err);
            return null;
        }
    }

    public async update<T extends Document>(
        model: Model<T>,
        filter: RootFilterQuery<T>,
        update: Partial<T>,
        options: Record<string, unknown> = {}
    ): Promise<IfAny<T,T> | null> {
        try {
            const result = await model.findOneAndUpdate(filter, update, { new: true, ...options });
            return result;
        } catch (err) {
            console.error('Error updating data:', err);
            return null;
        }
    }

    public async delete<T extends Document>(
        model: Model<T>,
        filter: RootFilterQuery<T>
    ): Promise<IfAny<T,T> | null> {
        try {
            const result = await model.findOneAndDelete(filter);
            return result;
        } catch (err) {
            console.error('Error deleting data:', err);
            return null;
        }
    }

    public close(): void {
        mongoose.connection.close();
    }
}