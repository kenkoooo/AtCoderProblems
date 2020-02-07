import React from "react";
import { PaginationPanelProps } from "react-bootstrap-table";
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown
} from "reactstrap";
import { NavLink } from "react-router-dom";

interface Props {
  paginationPanelProps: PaginationPanelProps;
  dataSize: number;
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (v, k) => k + start);
const pageList = (
  currPage: number,
  pageStartIndex: number,
  sizePerPage: number,
  dataSize: number
) => {
  if (dataSize === 0) {
    return [];
  }
  const maxPage = Math.ceil(dataSize / sizePerPage);
  if (maxPage <= 10) {
    return range(1, maxPage);
  }

  const pageNumbers: number[] = [currPage];
  let tmpExp = 1;
  while (true) {
    tmpExp *= 2;
    const tmpPageNumber = currPage - tmpExp + 1;
    if (tmpPageNumber < pageStartIndex) {
      break;
    }
    pageNumbers.unshift(tmpPageNumber);
  }
  if (pageNumbers[0] !== pageStartIndex) {
    pageNumbers.unshift(pageStartIndex);
  }

  tmpExp = 1;
  while (true) {
    tmpExp *= 2;
    const tmpPageNumber = currPage + tmpExp - 1;
    if (tmpPageNumber > maxPage) {
      break;
    }
    pageNumbers.push(tmpPageNumber);
  }
  if (pageNumbers.slice(-1)[0] !== maxPage) {
    pageNumbers.push(maxPage);
  }

  return pageNumbers;
};

export const ListPaginationPanel: React.FC<Props> = props => {
  const { paginationPanelProps, dataSize } = props;

  const pageNumbers = pageList(
    paginationPanelProps.currPage,
    paginationPanelProps.pageStartIndex,
    paginationPanelProps.sizePerPage,
    dataSize
  );

  return (
    <>
      <div className="col-md-2 col-xs-2 col-sm-2 col-lg-2">
        <UncontrolledDropdown className="react-bs-table-sizePerPage-dropdown">
          <DropdownToggle caret>
            {paginationPanelProps.sizePerPage}
          </DropdownToggle>
          <DropdownMenu>
            {(paginationPanelProps.sizePerPageList as Array<{
              text: string;
              value: number;
            }>).map(p => (
              <DropdownItem
                key={p.text}
                onClick={() => paginationPanelProps.changeSizePerPage(p.value)}
              >
                {p.text}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
      <div
        className="col-md-10 col-xs-10 col-sm-10 col-lg-10"
        style={{ display: "block" }}
      >
        <ul
          className="react-bootstrap-table-page-btns-ul pagination"
          style={{ flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          {pageNumbers.map((pageNumber: number) => {
            const className =
              (pageNumber === paginationPanelProps.currPage ? "active " : "") +
              "page-item";
            return (
              <li
                className={className}
                key={pageNumber}
                title={pageNumber.toString()}
              >
                <NavLink
                  to="#"
                  className="page-link"
                  onClick={() => paginationPanelProps.changePage(pageNumber)}
                >
                  {pageNumber}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};
