import React from "react";

interface Props {
  userId: string;
}

export const CategoryAchivement: React.FC<Props> = (props) => {
  return <p>{props.userId} さんの初めてのページ</p>;
};
