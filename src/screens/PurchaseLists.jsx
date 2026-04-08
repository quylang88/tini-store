import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import ScreenTransition from "../components/common/ScreenTransition";
import PurchaseListCompleteModal from "../components/inventory/PurchaseListCompleteModal";
import PurchaseListFormModal from "../components/inventory/PurchaseListFormModal";
import PurchaseListItemFormModal from "../components/inventory/PurchaseListItemFormModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import PurchaseListBottomBar from "../components/inventory/PurchaseListBottomBar";
import usePurchaseListLogic from "../hooks/inventory/usePurchaseListLogic";
import PurchaseListsView from "./inventory/PurchaseListsView";
import PurchaseListDetailView from "./inventory/PurchaseListDetailView";

const PurchaseLists = ({
  products,
  setProducts,
  purchaseLists,
  setPurchaseLists,
  settings,
  updateFab,
  isActive,
  onBack,
}) => {
  const [screenView, setScreenView] = useState("overview");
  const [direction, setDirection] = useState(0);

  const {
    sortedPurchaseLists,
    setSelectedListId,
    selectedList,
    listFormState,
    openCreateListForm,
    openEditListForm,
    closeListForm,
    saveList,
    deleteList,
    itemFormState,
    openCreateItemForm,
    openEditItemForm,
    closeItemForm,
    saveItem,
    deleteItem,
    completionState,
    closeCompletionModal,
    finalizeItemCompletion,
    requestCompleteItem,
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
    completingItemId,
  } = usePurchaseListLogic({
    purchaseLists,
    setPurchaseLists,
    products,
    setProducts,
  });

  const itemFormList = useMemo(
    () =>
      purchaseLists.find((list) => list.id === itemFormState.listId) || null,
    [itemFormState.listId, purchaseLists],
  );

  const completionList = useMemo(
    () =>
      purchaseLists.find((list) => list.id === completionState.listId) || null,
    [completionState.listId, purchaseLists],
  );

  const completionItem = useMemo(
    () =>
      completionList?.items?.find((item) => item.id === completionState.itemId) ||
      null,
    [completionState.itemId, completionList],
  );

  useEffect(() => {
    if (isActive) {
      updateFab({ isVisible: false });
    }
  }, [isActive, updateFab]);

  const showDetailScreen = screenView === "detail" && Boolean(selectedList);

  const handleOpenDetail = (listId) => {
    setSelectedListId(listId);
    setDirection(1);
    setScreenView("detail");
  };

  const handleBackFromDetail = () => {
    setDirection(-1);
    setScreenView("overview");
  };

  return (
    <div className="relative h-full bg-rose-50 overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        {!showDetailScreen && (
          <ScreenTransition
            key="purchase-lists-overview"
            custom={direction}
            className="h-full"
            onSwipeBack={onBack}
          >
            <PurchaseListsView
              purchaseLists={sortedPurchaseLists}
              onBack={onBack}
              onOpenList={handleOpenDetail}
              onCreateList={openCreateListForm}
              onEditList={openEditListForm}
              onDeleteList={(list) => deleteList(list)}
            />
            <PurchaseListBottomBar
              label="Tạo danh sách mới"
              icon={Plus}
              onClick={openCreateListForm}
            />
          </ScreenTransition>
        )}

        {showDetailScreen && selectedList && (
          <ScreenTransition
            key={`purchase-lists-detail-${selectedList.id}`}
            custom={direction}
            className="h-full"
            onSwipeBack={handleBackFromDetail}
          >
            <PurchaseListDetailView
              list={selectedList}
              products={products}
              onBack={handleBackFromDetail}
              onEditList={openEditListForm}
              onDeleteList={(list) =>
                deleteList(list, { onDeleted: handleBackFromDetail })
              }
              onEditItem={openEditItemForm}
              onDeleteItem={deleteItem}
              onCompleteItem={(listId, item) =>
                requestCompleteItem({ listId, item })
              }
              completingItemId={completingItemId}
            />
            <PurchaseListBottomBar
              label="Thêm mặt hàng"
              icon={Plus}
              onClick={() => openCreateItemForm(selectedList.id)}
            />
          </ScreenTransition>
        )}
      </AnimatePresence>

      <PurchaseListFormModal
        open={listFormState.open}
        list={listFormState.list}
        onClose={closeListForm}
        onSave={saveList}
      />

      <PurchaseListItemFormModal
        open={itemFormState.open}
        list={itemFormList}
        item={itemFormState.item}
        products={products}
        onClose={closeItemForm}
        onSave={saveItem}
      />

      <PurchaseListCompleteModal
        open={completionState.open}
        mode={completionState.mode}
        list={completionList}
        item={completionItem}
        categories={settings.categories}
        initialValues={completionState.initialValues}
        onClose={closeCompletionModal}
        onSubmit={(completionData) =>
          finalizeItemCompletion({
            listId: completionState.listId,
            itemId: completionState.itemId,
            completionData,
          })
        }
      />

      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

      <ErrorModal
        open={Boolean(errorModal)}
        title={errorModal?.title}
        message={errorModal?.message}
        onClose={() => setErrorModal(null)}
      />
    </div>
  );
};

export default PurchaseLists;
