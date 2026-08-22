// embedded inside UserSettingsEntity
export interface WaterSettings {
    is_active: boolean;
    daily_need: number;        // in Litres (e.g. 2.5)
    cup_size_ml: number;       // in ml (e.g. 250)
    reminder_interval_minutes: number;
    next_reminder_at?: Date;
}
