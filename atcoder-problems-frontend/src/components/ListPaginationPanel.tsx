import * as React from "react";
import {
  PaginationLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (v, k) => k + start);
const pageList = (
  currPage: number,
  pageStartIndex: number,
  totalPage: number
): number[] => {
  if (isNaN(totalPage) || totalPage <= 0) {
    return [];
  }
  if (totalPage <= 10) {
    return range(1, totalPage);
  }

  const pageNumbers: number[] = [currPage];
  let tmpExp = 1;
  for (;;) {
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
  for (;;) {
    tmpExp *= 2;
    const tmpPageNumber = currPage + tmpExp - 1;
    if (tmpPageNumber > totalPage) {
      break;
    }
    pageNumbers.push(tmpPageNumber);
  }
  if (pageNumbers.slice(-1)[0] !== totalPage) {
    pageNumbers.push(totalPage);
  }

  return pageNumbers;
};

// TODO: change the type of props. The official typing does not have enough
// fields.
export const CustomSizePerPageDropdownStandalone = (
  props: any
): JSX.Element => (
  <UncontrolledDropdown
    className="react-bs-table-sizePerPage-dropdown"
    style={{ float: "left" }}
  >
    <DropdownToggle caret>{props.sizePerPage}</DropdownToggle>
    <DropdownMenu>
      {(props.sizePerPageList as Array<{
        text: string;
        value: number;
      }>).map((p) => (
        <DropdownItem
          key={p.text}
          // Change the page number to 1 when size of page is changed to prevent
          // errors.
          onClick={(): void => props.onSizePerPageChange?.(p.value, 1)}
        >
          {p.text}
        </DropdownItem>
      ))}
    </DropdownMenu>
  </UncontrolledDropdown>
);

// TODO: change the type of props. The official typing does not have enough
// fields.
export const BinaryPaginationListStandalone = (props: any): JSX.Element => {
  const pageNumbers = pageList(
    props.page,
    props.pageStartIndex,
    Math.ceil(props.dataSize / props.sizePerPage)
  );

  return (
    <>
      <ul
        className="react-bootstrap-table-page-btns-ul pagination"
        style={{ flexWrap: "wrap", justifyContent: "flex-end" }}
      >
        {pageNumbers.map((pageNumber: number) => {
          const className =
            (pageNumber === props.page ? "active " : "") + "page-item";
          return (
            <li
              className={className}
              key={pageNumber}
              title={pageNumber.toString()}
            >
              <PaginationLink
                onClick={(): void => props.onPageChange(pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </li>
          );
        })}
      </ul>
    </>
  );
};
