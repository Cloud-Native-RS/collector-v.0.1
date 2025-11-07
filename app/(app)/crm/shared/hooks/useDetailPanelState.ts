import { useState, useEffect, useRef } from "react";

export interface DetailPanelState<T> {
  isEditMode: boolean;
  editedEntity: T | null;
  editedNotes: string[];
  editedLinkedIn: string;
  editedTags: string[];
  notes: string[];
  loadingNotes: boolean;
}

export interface UseDetailPanelStateProps<T> {
  entity: T | null;
  open: boolean;
  propNotes?: string[];
  tags?: string[];
  linkedIn?: string;
  isNewEntity?: boolean;
  defaultNewEntity: T;
}

export function useDetailPanelState<T>({
  entity,
  open,
  propNotes = [],
  tags = [],
  linkedIn,
  isNewEntity = false,
  defaultNewEntity,
}: UseDetailPanelStateProps<T>) {
  const [isEditMode, setIsEditMode] = useState(isNewEntity);
  const [editedEntity, setEditedEntity] = useState<T | null>(
    isNewEntity ? defaultNewEntity : null
  );
  const [editedNotes, setEditedNotes] = useState<string[]>(propNotes);
  const [editedLinkedIn, setEditedLinkedIn] = useState<string>(linkedIn || "");
  const [editedTags, setEditedTags] = useState<string[]>(tags);
  const [notes, setNotes] = useState<string[]>(propNotes);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const lastFetchedEntityIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Initialize edit state when entity changes
  useEffect(() => {
    if (isNewEntity) {
      setEditedEntity(defaultNewEntity);
      setIsEditMode(true);
    } else if (entity) {
      setEditedEntity({ ...entity } as T);
      setIsEditMode(false);
    }
  }, [entity, isNewEntity, defaultNewEntity]);

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      setLoadingNotes(false);
      lastFetchedEntityIdRef.current = null;
      isFetchingRef.current = false;
      if (!isNewEntity) {
        setIsEditMode(false);
      }
    }
  }, [open, isNewEntity]);

  // Update notes when prop changes
  useEffect(() => {
    setNotes(propNotes);
    setEditedNotes(propNotes);
  }, [propNotes]);

  // Update LinkedIn when prop changes
  useEffect(() => {
    setEditedLinkedIn(linkedIn || "");
  }, [linkedIn]);

  // Update tags when prop changes
  useEffect(() => {
    setEditedTags(tags);
  }, [tags]);

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (isNewEntity) {
      return; // Don't allow cancel for new entity
    }
    setIsEditMode(false);
    if (entity) {
      setEditedEntity({ ...entity } as T);
    }
    setEditedNotes(notes);
    setEditedLinkedIn(linkedIn || "");
    setEditedTags(tags);
  };

  const updateEditedEntity = (updates: Partial<T>) => {
    setEditedEntity((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return {
    isEditMode,
    editedEntity,
    editedNotes,
    editedLinkedIn,
    editedTags,
    notes,
    loadingNotes,
    lastFetchedEntityIdRef,
    isFetchingRef,
    setIsEditMode,
    setEditedEntity,
    setEditedNotes,
    setEditedLinkedIn,
    setEditedTags,
    setNotes,
    setLoadingNotes,
    handleEdit,
    handleCancel,
    updateEditedEntity,
  };
}
