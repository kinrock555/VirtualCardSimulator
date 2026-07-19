export const STORAGE_KEYS = {
  cardNameOverrides: 'vct.cardNameOverrides.v1',
  decks: 'vct.decks.v1',
  tableTheme: 'vct.tableTheme.v1',
  roomEnvironment: 'vct.roomEnvironment.v1',
  handPanelCollapsed: 'vct.handPanelCollapsed.v1',
  cameraView: 'vct.cameraView.v1',
  savedBoards: 'vct.savedBoards.v1',
  // Reuses the pre-existing "operationGuideCollapsed" storage key string so
  // a user's saved left-panel preference carries over unchanged even though
  // this field was renamed/moved into useTableStore.
  leftPanelCollapsed: 'vct.operationGuideCollapsed.v1',
  previewPanelCollapsed: 'vct.previewPanelCollapsed.v1',
  topBarCollapsed: 'vct.topBarCollapsed.v1',
  loupeEnabled: 'vct.loupeEnabled.v1',
  magnifierZoom: 'vct.magnifierZoom.v1',
  graphicsQuality: 'vct.graphicsQuality.v1',
  selectedPlaymatId: 'vct.selectedPlaymatId.v1',
  tableType: 'vct.tableType.v1',
} as const;
