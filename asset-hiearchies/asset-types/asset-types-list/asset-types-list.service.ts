import { Injectable } from '@angular/core';
import { Column, DataSourceModifier, Pagination, ServerSideDataResult } from '@c8y/ngx-components';
import {
    InventoryService,
    QueriesUtil,
    IResultList,
    IResult,
    IManagedObject,
    IdReference,
} from "@c8y/client";

@Injectable({ providedIn: 'root' })
export class AssetTypesListService {
    serverSideDataCallback: Promise<ServerSideDataResult>;

    columns: Column[];

    pagination: Pagination = {
        pageSize: 10,
        currentPage: 1,
    };

    private readonly queriesUtil = new QueriesUtil();

    private BASE_QUERY = {
        __has: 'c8y_IsAssetType',
    };

    constructor(private inventoryService: InventoryService) {
        this.serverSideDataCallback = this.onDataSourceModifier.bind(this);
    }

    async getProperties(propertyIds: string[]): Promise<IManagedObject[]> {
        const promisses = propertyIds.map((propertyId) => this.inventoryService.detail(propertyId));
        return (await Promise.all(promisses)).map(({ data }) => data);
    }

    async deleteAssetTypes(assetTypeIds: string[]): Promise<void> {
        if (!assetTypeIds || assetTypeIds.length === 0) {
            console.error('Missing asset ids');
            return;
        }

        const promisses: Promise<void>[] = [];
        assetTypeIds.forEach(assetId => promisses.push(this.deleteAssetType(assetId)));

        await Promise.all(promisses);
    }

    async deleteAssetType(assetTypeId: string): Promise<void> {
        if (!assetTypeId || assetTypeId.length === 0) {
            console.error('Missing asset id');
            return;
        }

        await this.inventoryService.delete(assetTypeId);
    }

    downloadFile(data: string, fileName: string, mimeType: string) {
        const blob = new Blob([data], { type: mimeType });
        const blobUrl = window.URL.createObjectURL(blob);

        const anchorTemp = document.createElement("a");
        document.body.appendChild(anchorTemp);

        anchorTemp.href = blobUrl;
        anchorTemp.download = fileName;
        anchorTemp.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(anchorTemp);
        }, 0);
    }


    async onDataSourceModifier(dataSourceModifier: DataSourceModifier): Promise<ServerSideDataResult> {
        this.columns = [...(dataSourceModifier.columns || [])];

        const filterQuery = this.createQueryFilter(dataSourceModifier.columns);
        const allQuery = this.createQueryFilter([]);

        const properties = this.fetchForPage(
            filterQuery,
            dataSourceModifier.pagination
        );
        const filtered = this.fetchCount(filterQuery);
        const total = this.fetchCount(allQuery);

        const [propertyResponse, filteredSize, size] = await Promise.all([
            properties,
            filtered,
            total,
        ]);

        const result: ServerSideDataResult = {
            size,
            filteredSize,
            ...propertyResponse,
        };

        return result;
    }

    private fetchForPage(
        query: object,
        pagination: Pagination
    ): Promise<IResultList<IManagedObject>> {
        const filters = {
            withParents: true,
            pageSize: pagination.pageSize,
            currentPage: pagination.currentPage,
            withTotalPages: false,
            ...query,
        };

        return this.inventoryService.list(filters);
    }

    /**
     * Returns the complete count of items. Use wisely ond only if really necessary as the calculation of the count is expensive on server-side.
     * @param query
     */
    private fetchCount(
        query: object
    ): Promise<number> {
        const filters = {
            pageSize: 1,
            currentPage: 1,
            withTotalPages: true,
            ...query,
        };
        return this.inventoryService
            .list(filters)
            .then((result) => result.paging.totalPages);
    }

    private createQueryFilter(columns: Column[]): { query: string } {
        const query = columns.reduce(this.extendQueryByColumn, {
            __filter: this.BASE_QUERY,
            __orderby: [],
        });

        const queryString = this.queriesUtil.buildQuery(query);

        return { query: queryString };
    }

    private extendQueryByColumn = (query: any, column: Column) => {
        if (column.filterable && column.filterPredicate) {
            const queryObj: any = {};
            queryObj[column.path] = column.filterPredicate;
            query.__filter = { ...query.__filter, ...queryObj };
        }

        if (column.filterable && column.externalFilterQuery) {
            query.__filter = { ...query.__filter, ...column.externalFilterQuery };
        }

        if (column.sortable && column.sortOrder) {
            const cs: any = {};
            cs[column.path] = column.sortOrder === "asc" ? 1 : -1;
            query.__orderby.push(cs);
        }

        return query;
    };
}