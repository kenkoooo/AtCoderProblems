import * as React from "react";

import ToolkitProvider, { Search } from "react-bootstrap-table2-toolkit";
import paginationFactory, {
  PaginationProvider,
  PaginationListStandalone,
} from "react-bootstrap-table2-paginator";
import BootstrapTable, {
  BootstrapTableProps,
  PaginationOptions,
} from "react-bootstrap-table-next";
import filterFactory from "react-bootstrap-table2-filter";
import {
  BinaryPaginationListStandalone,
  CustomSizePerPageDropdownStandalone,
} from "./ListPaginationPanel";

interface Props<T extends object = any> extends BootstrapTableProps<T> {
  // Set the default size per page.
  sizePerPage?: 10 | 20 | 50 | 100 | 200;

  // Use ListPaginationPanel.
  useBinaryPagination?: boolean;

  // Disable pagination or boolean.
  usePagination?: boolean;
  useSearch?: boolean;

  // Escape hatches
  paginationOptions?: Partial<PaginationOptions>;
}

export const ReactBootstrapTable = <T extends object>({
  paginationOptions,
  usePagination,
  useSearch,
  sizePerPage,
  data,
  columns,
  keyField,
  useBinaryPagination,
  ...remainingProps
}: Props<T>): React.ReactElement => {
  return (
    <div>
      <ToolkitProvider
        bootstrap4
        keyField={keyField}
        data={data}
        columns={columns}
        search
      >
        {({ searchProps, baseProps }): JSX.Element => (
          <PaginationProvider
            pagination={paginationFactory({
              custom: true,
              sizePerPage: sizePerPage ?? (!usePagination ? 1e9 : 20),
              sizePerPageList: [
                {
                  text: "10",
                  value: 10,
                },
                {
                  text: "20",
                  value: 20,
                },
                {
                  text: "50",
                  value: 50,
                },
                {
                  text: "100",
                  value: 100,
                },
                {
                  text: "200",
                  value: 200,
                },
                {
                  text: "All",
                  value: data.length,
                },
              ],
              ...paginationOptions,
            })}
          >
            {({ paginationProps, paginationTableProps }): JSX.Element => (
              <>
                {useSearch && (
                  <div style={{ textAlign: "right", marginBottom: ".5rem" }}>
                    <Search.SearchBar {...searchProps} />
                  </div>
                )}

                {usePagination && (
                  <div>
                    <CustomSizePerPageDropdownStandalone {...paginationProps} />

                    {useBinaryPagination ? (
                      <BinaryPaginationListStandalone {...paginationProps} />
                    ) : (
                      <PaginationListStandalone {...paginationProps} />
                    )}
                  </div>
                )}

                <BootstrapTable
                  bootstrap4
                  search={useSearch}
                  filter={filterFactory()}
                  {...baseProps}
                  {...paginationTableProps}
                  {...remainingProps}
                />
              </>
            )}
          </PaginationProvider>
        )}
      </ToolkitProvider>
    </div>
  );
};
