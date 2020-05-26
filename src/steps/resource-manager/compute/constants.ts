// Step IDs
export const RM_COMPUTE_VIRTUAL_MACHINE_IMAGES =
  "rm-compute-virtual-machine-images";
export const RM_COMPUTE_VIRTUAL_MACHINE_DISKS =
  "rm-compute-virutal-machine-disks";
export const RM_COMPUTE_VIRTUAL_MACHINES = "rm-compute-virtual-machines";

// Graph object
export const VIRTUAL_MACHINE_ENTITY_TYPE = "azure_vm";
export const VIRTUAL_MACHINE_ENTITY_CLASS = "Host";

export const VIRTUAL_MACHINE_IMAGE_ENTITY_TYPE = "azure_image";
export const VIRTUAL_MACHINE_IMAGE_ENTITY_CLASS = "Image";

export const DISK_ENTITY_TYPE = "azure_managed_disk";
export const DISK_ENTITY_CLASS = ["DataStore", "Disk"];

export const VIRTUAL_MACHINE_DISK_RELATIONSHIP_TYPE = "azure_vm_uses_disk";