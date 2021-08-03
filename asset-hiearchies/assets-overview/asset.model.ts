export interface Asset {
    name: string;
    type: string;
    description?: string;
    c8y_ExternalAssetId?: string;
    c8y_AssetOwner?: {
        name: string;
        email: string;
    }
}