/**
 * DocuCheck Africa icon set
 * ---------------------------------------------------------------------------
 * Thin wrappers around the real Hugeicons (@hugeicons/react +
 * @hugeicons/core-free-icons), exported under the names used in
 * DESIGN_SYSTEM.md.  <DashboardSquare01Icon size={20} className="text-ink" />
 * Colour follows currentColor; default size 20 (override via `size`).
 */

import { HugeiconsIcon } from "@hugeicons/react";
import * as Icons from "@hugeicons/core-free-icons";

function makeIcon(name) {
  function Icon({ size = 20, ...props }) {
    return <HugeiconsIcon icon={Icons[name]} size={size} {...props} />;
  }
  Icon.displayName = name;
  return Icon;
}

/* Navigation */
export const DashboardSquare01Icon = makeIcon("DashboardSquare01Icon");
export const FolderLibraryIcon = makeIcon("FolderLibraryIcon");
export const CheckmarkBadge01Icon = makeIcon("CheckmarkBadge01Icon");
export const DocumentValidationIcon = makeIcon("DocumentValidationIcon");
export const Notification01Icon = makeIcon("Notification01Icon");
export const UserMultipleIcon = makeIcon("UserMultipleIcon");
export const UserIcon = makeIcon("UserIcon");
export const Settings02Icon = makeIcon("Settings02Icon");
export const Logout01Icon = makeIcon("Logout01Icon");

/* Layout / chrome */
export const Menu01Icon = makeIcon("Menu01Icon");
export const Cancel01Icon = makeIcon("Cancel01Icon");
export const Search01Icon = makeIcon("Search01Icon");
export const ArrowDown01Icon = makeIcon("ArrowDown01Icon");

/* Actions */
export const CloudUploadIcon = makeIcon("CloudUploadIcon");
export const Add01Icon = makeIcon("Add01Icon");
export const ArrowLeft01Icon = makeIcon("ArrowLeft01Icon");
export const CustomerSupportIcon = makeIcon("CustomerSupportIcon");
export const ViewIcon = makeIcon("ViewIcon");
export const ViewOffIcon = makeIcon("ViewOffIcon");

/* Verdict / status */
export const CheckmarkCircle02Icon = makeIcon("CheckmarkCircle02Icon");
export const Alert02Icon = makeIcon("Alert02Icon");
export const CancelCircleIcon = makeIcon("CancelCircleIcon");
export const Time02Icon = makeIcon("Time02Icon");

/* Landing page */
export const ComputerIcon = makeIcon("ComputerIcon");
export const Clock01Icon = makeIcon("Clock01Icon");
export const File01Icon = makeIcon("File01Icon");
export const Globe02Icon = makeIcon("Globe02Icon");
export const SparklesIcon = makeIcon("SparklesIcon");
export const ChartColumnIcon = makeIcon("ChartColumnIcon");
export const Layers01Icon = makeIcon("Layers01Icon");
export const AiMagicIcon = makeIcon("AiMagicIcon");
export const DistributionIcon = makeIcon("DistributionIcon");
export const File02Icon = makeIcon("File02Icon");
export const ShieldIcon = makeIcon("ShieldIcon");
