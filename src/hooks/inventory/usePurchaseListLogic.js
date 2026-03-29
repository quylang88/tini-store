import { useCallback, useMemo, useState } from "react"
import { normalizeString } from "../../utils/formatters/formatUtils"
import {
  completePurchaseListItem,
  createPurchaseList,
  createPurchaseListItem,
  getItemCompletionRequirement,
  updatePurchaseListItemData,
  updatePurchaseListItems,
  updatePurchaseListMeta,
} from "../../utils/inventory/purchaseListUtils"

const sortListsByUpdatedAt = (lists = []) =>
  [...lists].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return timeB - timeA
  })

const usePurchaseListLogic = ({
  purchaseLists,
  setPurchaseLists,
  products,
  setProducts,
}) => {
  const [selectedListId, setSelectedListId] = useState(null)
  const [listFormState, setListFormState] = useState({
    open: false,
    list: null,
  })
  const [itemFormState, setItemFormState] = useState({
    open: false,
    listId: null,
    item: null,
  })
  const [completionState, setCompletionState] = useState({
    open: false,
    listId: null,
    itemId: null,
    mode: "new",
    initialValues: {},
  })
  const [confirmModal, setConfirmModal] = useState(null)
  const [errorModal, setErrorModal] = useState(null)
  const [completingItemId, setCompletingItemId] = useState(null)

  const sortedPurchaseLists = useMemo(
    () => sortListsByUpdatedAt(purchaseLists),
    [purchaseLists],
  )

  const selectedList = useMemo(
    () => purchaseLists.find((list) => list.id === selectedListId) || null,
    [purchaseLists, selectedListId],
  )

  const openCreateListForm = useCallback(() => {
    setListFormState({ open: true, list: null })
  }, [])

  const openEditListForm = useCallback((list) => {
    if (!list) return
    setListFormState({ open: true, list })
  }, [])

  const closeListForm = useCallback(() => {
    setListFormState({ open: false, list: null })
  }, [])

  const saveList = useCallback(
    ({ list, title, warehouse, note }) => {
      const trimmedTitle = String(title || "").trim()
      if (!trimmedTitle) {
        setErrorModal({
          title: "Thiếu tên danh sách",
          message: "Vui lòng nhập tên cho danh sách mua hàng.",
        })
        return false
      }

      const normalizedTitle = normalizeString(trimmedTitle)
      const duplicateList = purchaseLists.find(
        (entry) =>
          normalizeString(entry.title) === normalizedTitle &&
          entry.id !== list?.id,
      )

      if (duplicateList) {
        setErrorModal({
          title: "Tên danh sách bị trùng",
          message: "Đã có một danh sách khác dùng tên này. Bạn thử đổi tên khác nhé.",
        })
        return false
      }

      if (list) {
        setPurchaseLists((prev) =>
          prev.map((entry) =>
            entry.id === list.id
              ? updatePurchaseListMeta(entry, { title, warehouse, note })
              : entry,
          ),
        )
      } else {
        const nextList = createPurchaseList({ title, warehouse, note })
        setPurchaseLists((prev) => sortListsByUpdatedAt([nextList, ...prev]))
        setSelectedListId(nextList.id)
      }

      closeListForm()
      return true
    },
    [closeListForm, purchaseLists, setPurchaseLists],
  )

  const deleteList = useCallback(
    (list, { onDeleted } = {}) => {
      if (!list) return
      const itemCount = list.items?.length || 0

      setConfirmModal({
        title: "Xoá danh sách mua?",
        message:
          itemCount > 0
            ? `Danh sách "${list.title}" đang có ${itemCount} mặt hàng. Xoá danh sách sẽ xoá luôn cả lịch sử đã mua của list này.`
            : `Bạn có chắc muốn xoá danh sách "${list.title}" không?`,
        confirmLabel: "Xoá danh sách",
        cancelLabel: "Giữ lại",
        tone: "danger",
        onConfirm: () => {
          setPurchaseLists((prev) => prev.filter((entry) => entry.id !== list.id))
          if (selectedListId === list.id) {
            setSelectedListId(null)
          }
          onDeleted?.()
        },
      })
    },
    [selectedListId, setPurchaseLists],
  )

  const openCreateItemForm = useCallback((listId) => {
    setItemFormState({
      open: true,
      listId,
      item: null,
    })
  }, [])

  const openEditItemForm = useCallback((listId, item) => {
    if (!listId || !item) return
    setItemFormState({
      open: true,
      listId,
      item,
    })
  }, [])

  const closeItemForm = useCallback(() => {
    setItemFormState({
      open: false,
      listId: null,
      item: null,
    })
  }, [])

  const saveItem = useCallback(
    ({ listId, item, product, kind, name, quantity, note }) => {
      if (!listId) return false

      const trimmedName =
        kind === "existing"
          ? String(product?.name || "").trim()
          : String(name || "").trim()
      const quantityValue = Math.max(1, Number(quantity) || 0)

      if (!trimmedName) {
        setErrorModal({
          title: "Thiếu tên mặt hàng",
          message:
            kind === "existing"
              ? "Vui lòng chọn một sản phẩm có sẵn trong kho."
              : "Vui lòng nhập tên mặt hàng cần mua.",
        })
        return false
      }

      if (kind === "existing" && !product) {
        setErrorModal({
          title: "Chưa chọn sản phẩm",
          message:
            "Hãy chạm chọn đúng một sản phẩm trong danh sách gợi ý trước khi lưu item này.",
        })
        return false
      }

      if (quantityValue <= 0) {
        setErrorModal({
          title: "Số lượng chưa hợp lệ",
          message: "Số lượng mua phải lớn hơn 0.",
        })
        return false
      }

      setPurchaseLists((prev) =>
        prev.map((listEntry) => {
          if (listEntry.id !== listId) return listEntry

          if (item) {
            const nextItems = listEntry.items.map((entry) =>
              entry.id === item.id
                ? updatePurchaseListItemData(entry, {
                    product,
                    kind,
                    name: trimmedName,
                    quantity: quantityValue,
                    note,
                  })
                : entry,
            )
            return updatePurchaseListItems(listEntry, nextItems)
          }

          const nextItem = createPurchaseListItem({
            product,
            kind,
            name: trimmedName,
            quantity: quantityValue,
            note,
          })
          return updatePurchaseListItems(listEntry, [
            ...(listEntry.items || []),
            nextItem,
          ])
        }),
      )

      closeItemForm()
      return true
    },
    [closeItemForm, setPurchaseLists],
  )

  const deleteItem = useCallback(
    (listId, item) => {
      if (!listId || !item) return

      setConfirmModal({
        title: "Xoá mặt hàng?",
        message: `Bạn có chắc muốn xoá "${item.name}" khỏi danh sách mua không?`,
        confirmLabel: "Xoá mặt hàng",
        cancelLabel: "Giữ lại",
        tone: "danger",
        onConfirm: () => {
          setPurchaseLists((prev) =>
            prev.map((listEntry) => {
              if (listEntry.id !== listId) return listEntry
              const nextItems = listEntry.items.filter(
                (entry) => entry.id !== item.id,
              )
              return updatePurchaseListItems(listEntry, nextItems)
            }),
          )
        },
      })
    },
    [setPurchaseLists],
  )

  const closeCompletionModal = useCallback(() => {
    setCompletionState({
      open: false,
      listId: null,
      itemId: null,
      mode: "new",
      initialValues: {},
    })
  }, [])

  const finalizeItemCompletion = useCallback(
    ({ listId, itemId, completionData }) => {
      if (!listId || !itemId || completingItemId === itemId) {
        return false
      }

      setCompletingItemId(itemId)
      try {
        const result = completePurchaseListItem({
          purchaseLists,
          products,
          listId,
          itemId,
          completionData,
        })
        setProducts(result.products)
        setPurchaseLists(result.purchaseLists)
        closeCompletionModal()
        return true
      } catch (error) {
        setErrorModal({
          title: "Chưa thể hoàn tất",
          message:
            error?.message ||
            "Không thể chuyển item này sang lịch sử đã mua. Vui lòng thử lại.",
        })
        return false
      } finally {
        setCompletingItemId(null)
      }
    },
    [
      closeCompletionModal,
      completingItemId,
      products,
      purchaseLists,
      setProducts,
      setPurchaseLists,
    ],
  )

  const requestCompleteItem = useCallback(
    ({ listId, item }) => {
      if (!item || item.status === "completed" || completingItemId === item.id) {
        return
      }

      const product = item.productId
        ? products.find((entry) => entry.id === item.productId)
        : null
      const requirement = getItemCompletionRequirement({ item, product })

      if (requirement.mode === "missing-product") {
        setErrorModal({
          title: "Sản phẩm không còn trong kho",
          message:
            "Mặt hàng này đang trỏ tới một sản phẩm đã bị xoá. Bạn hãy sửa item và chọn lại sản phẩm trước khi hoàn tất.",
        })
        return
      }

      if (requirement.mode === "ready") {
        finalizeItemCompletion({
          listId,
          itemId: item.id,
          completionData: { cost: requirement.cost },
        })
        return
      }

      setCompletionState({
        open: true,
        listId,
        itemId: item.id,
        mode: requirement.mode,
        initialValues:
          requirement.mode === "existing-missing-cost"
            ? { cost: "" }
            : {
                price: product?.price ? String(product.price) : "",
                cost: "",
                category: product?.category || "",
              },
      })
    },
    [completingItemId, finalizeItemCompletion, products],
  )

  return {
    sortedPurchaseLists,
    selectedListId,
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
  }
}

export default usePurchaseListLogic
