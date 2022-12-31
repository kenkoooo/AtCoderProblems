import React, { ReactNode, useState } from "react";
import { Modal, ModalHeader, ModalBody, Badge, Tooltip } from "reactstrap";

interface Props {
  id: string;
  children: ReactNode;
  title: string;
}

export const HelpBadgeModal = (props: Props): JSX.Element => {
  const { id, title, children } = props;
  const [isModalOpen, setModalOpen] = useState(false);
  const [isTooltipOpen, setTooltipOpen] = useState(false);

  const toggleModal = (): void => setModalOpen(!isModalOpen);
  const badgeId = "HelpBadgeTooltipModal-" + id;

  return (
    <>
      <Badge
        color="secondary"
        pill
        id={badgeId}
        style={{ cursor: "pointer" }}
        onClick={toggleModal}
      >
        ?
      </Badge>
      <Tooltip
        placement="top"
        target={badgeId}
        isOpen={isTooltipOpen}
        toggle={(): void => setTooltipOpen(!isTooltipOpen)}
      >
        Click to see detailed explanation.
      </Tooltip>
      <Modal isOpen={isModalOpen} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
      </Modal>
    </>
  );
};
