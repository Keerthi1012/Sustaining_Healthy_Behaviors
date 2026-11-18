import { useI18n } from "../../i18n";
import Sheet from "../ui/Sheet";

function MicroActionCard({ action, onDismiss }) {
    const { t } = useI18n();

    if (!action) return null;

    return (
        <Sheet
            title={t(action.titleKey)}
            eyebrow={t(action.bodyKey)}
            onClose={onDismiss}
        >
            <p>{t(action.bodyKey)}</p>
            <div className="micro-action__actions">
                <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={onDismiss}
                >
                    {t("common.done")}
                </button>
            </div>
        </Sheet>
    );
}

export default MicroActionCard;