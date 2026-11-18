import walkImage from './exercises/images/activity-movement-walk-5.png';
import walkMobility from './exercises/images/activity-movement-mobility-3.png';
import movementLongerWay from './exercises/images/activity-movement-longer-way.png';
import movementFreshAir from './exercises/images/activity-movement-fresh-air.png';
import movementRhythm from './exercises/images/activity-movement-rhythm.png';
import movementReset from './exercises/images/activity-movement-reset.png';
import movementReflect from './exercises/images/activity-movement-reflect.png';
import sleepWake from './exercises/images/activity-sleep-wake-time.png';
import sleepWind from './exercises/images/activity-sleep-wind-down.png';
import sleepWorry from './exercises/images/activity-sleep-worry-dump.png';
import sleepRoom from './exercises/images/activity-sleep-room.png';
import sleepCaffeine from './exercises/images/activity-sleep-caffeine.png';
import sleepNotice from './exercises/images/activity-sleep-notice.png';
import sleepMorning from './exercises/images/activity-sleep-morning-light.png';
import nutritionVeggie from './exercises/images/activity-nutrition-veggie-first.png';
import nutritionWater from './exercises/images/activity-nutrition-water-anchor.png';
import nutritionHalf from './exercises/images/activity-nutrition-half-plate.png';
import nutritionProtein from './exercises/images/activity-nutrition-protein-pair.png';
import nutritionMindful from './exercises/images/activity-nutrition-mindful-pause.png';
import smokingDelay from './exercises/images/activity-smoking-delay-5.png';
import smokingWater from './exercises/images/activity-smoking-water-breath.png';
import smokingSwap from './exercises/images/activity-smoking-trigger-swap.png';
import smokingCue from './exercises/images/activity-smoking-clear-cue.png';
import smokingTrigger from './exercises/images/activity-smoking-notice-trigger.png';
const DOMAIN_MEDIA = {
    movement: {
        icon: "Footprints",
        accent: "moss",
        alt: "A calm movement scene",
        altAr: "مشهد هادئ للحركة",
    },
    sleep: {
        icon: "Moon",
        accent: "dusk",
        alt: "A calm night scene",
        altAr: "مشهد ليلي هادئ",
    },
    nutrition: {
        icon: "Salad",
        accent: "honey",
        alt: "A calm meal scene",
        altAr: "مشهد هادئ لوجبة",
    },
    smoking: {
        icon: "Wind",
        accent: "sky",
        alt: "A calm clear-sky scene",
        altAr: "مشهد هادئ بسماء صافية",
    },
};

const ADAPTATION_AR = {
    indoor_heat_safe: {
        anchor: "داخل المبنى: ممر أو مركز تجاري أو مكان مظلل بارد",
        why: "الحركة داخل المبنى تحافظ على الأمان في الحرارة الشديدة وتظل محسوبة كحركة.",
    },
    shift_aligned: {
        anchor: "قبل نحو 90 دقيقة من فترة نومك الرئيسية",
        why: "ربطنا هذه الإشارة بجدول المناوبات بدلًا من وقت ليلي ثابت.",
    },
    fasting_aligned: {
        anchor: "عند الإفطار أو السحور أو في نافذة غير صيام",
        why: "وضعنا هذه الإشارة في نافذة غير صيام لدعم روتينك دون التداخل مع الصيام.",
    },
    mobility_adapted: {
        anchor: "جلوسًا أو بدعم أو في مكان مريح",
        why: "هذه النسخة تحافظ على حركة لطيفة منخفضة الأثر مع دعم قريب.",
    },
};

const READINESS_AR = {
    hot: {
        anchor: ADAPTATION_AR.indoor_heat_safe.anchor,
        why: "بقيت خطوة اليوم في الداخل أو الظل بسبب الحرارة.",
    },
    rainy: {
        anchor: "في الداخل أو تحت غطاء",
        why: "بقيت خطوة اليوم في الداخل أو تحت غطاء بسبب المطر.",
    },
    cold: {
        anchor: "مكان دافئ في الداخل أو مسار محمي جيدًا",
        why: "بقيت خطوة اليوم دافئة ومحمية بسبب البرد.",
    },
    low: {
        anchor: "مكان مريح، وعلى وتيرتك",
        why: "ضُبطت خطوة اليوم على طاقتك ووقتك الحاليين.",
    },
};

export const EXERCISE_CONTENT = {
    "movement-walk-5": {
        media: { icon: "Footprints", accent: "moss", alt: "A quiet walking path", altAr: "مسار مشي هقيق", src: walkImage },
        ar: {
            title: "مشي خمس دقائق",
            text: "خذ مشية مريحة بوتيرتك. الطريق يُحتسب حتى إن كان قصيرًا.",
            why: "خطة واضحة ومهمة صغيرة متدرجة تسهّل البداية دون الحاجة إلى يوم مثالي.",
            anchor: "بعد وجبة أو روتين يومي آخر",
            fallbackTitle: "مشي دقيقتين",
            fallbackText: "امشِ داخل المنزل دقيقتين، أو ارفع قدميك بلطف في مكانك.",
        },
    },
    "movement-mobility-3": {
        media: { icon: "Activity", accent: "moss", alt: "Gentle stretches", altAr: "تمددات لطيفة", src: walkMobility },
        ar: {
            title: "أيقظ جسدك",
            text: "جرّب ثلاث دقائق لطيفة من تدوير الكتفين ورفع السمانة أو تمددات مريحة.",
            why: "ممارسة الحركة بشكل بسيط تبني الثقة والقدرة الجسدية.",
            anchor: "قبل روتين الصباح أو بعد الجلوس طويلًا",
            fallbackTitle: "استراحة على الكرسي",
            fallbackText: "قم ببعض تدويرات الكتفين ودوائر الكاحلين وأنت جالس.",
        },
    },
    "movement-longer-way": {
        media: { icon: "Route", accent: "moss", alt: "A path with a longer route", altAr: "مسار فيه طريق أطول", src: movementLongerWay },
        ar: {
            title: "اسلك الطريق الأطول",
            text: "أضف خمس دقائق مشي إلى رحلة تقوم بها أصلًا.",
            why: "إضافة الحركة إلى روتين قائم تقلل الحاجة إلى وقت أو حافز إضافي.",
            anchor: "رحلة أو مهمة أو استراحة منتظمة",
            fallbackTitle: "وقفة إضافية واحدة",
            fallbackText: "قم بمشية قصيرة واحدة حول منزلك أو مكان عملك.",
        },
    },
    "movement-fresh-air": {
        media: { icon: "Sun", accent: "moss", alt: "Walking in fresh air", altAr: "مشي في الهواء الطلق", src: movementFreshAir },
        ar: {
            title: "قليل من الهواء النقي",
            text: "خذ مشية هادئة سبع دقائق في الخارج، أو ابحث عن مكان داخلي بارد إن كان الجو حارًا.",
            why: "تكرار الحركة في السياق نفسه يساعد الروتين على أن يصبح أسهل في البدء.",
            anchor: "جزء أبرد من اليوم",
            fallbackTitle: "استراحة ثلاث دقائق",
            fallbackText: "اخرج ثلاث دقائق، أو امشِ في الداخل قرب نافذة.",
        },
    },
    "movement-rhythm": {
        media: { icon: "Music", accent: "moss", alt: "Moving to music", altAr: "حركة على الموسيقى", src: movementRhythm },
        ar: {
            title: "تحرّك على إيقاعك",
            text: "اختر أغنية وتحرّك بأريحية طوال مدتها. الرقص أو التمايل أو المشي كلها تُحتسب.",
            why: "ربط الحركة بالموسيقى قد يجعلها أكثر متعة وأسهل في التكرار.",
            anchor: "أغنية تستمتع بها بالفعل",
            fallbackTitle: "أغنية لطيفة واحدة",
            fallbackText: "تمايل أو انقر على الإيقاع مع أغنية واحدة وأنت جالس.",
        },
    },
    "movement-reset": {
        media: { icon: "RotateCcw", accent: "moss", alt: "A short movement break", altAr: "استراحةحركة قصيرة", src: movementReset },
        ar: {
            title: "استراحة حركة لطيفة",
            text: "خذ استراحة حركة قصيرة بدلًا من البقاء ساكنًا لمدة أخرى.",
            why: "استراحة صغيرة تقطع الجلوس الطويل وتجعل الحركة تبدو ممكنة.",
            anchor: "بعد فترة طويلة من الجلوس",
            fallbackTitle: "تمدد دقيقة واحدة",
            fallbackText: "قف، وتمدد بأريحية، ثم اجلس مرة أخرى.",
        },
    },
    "movement-reflect": {
        media: { icon: "NotebookPen", accent: "moss", alt: "Reflecting on the week", altAr: "تأمل في الأسبوع", src: movementReflect },
        ar: {
            title: "لاحظ ما ساعدك",
            text: "راجع الأسبوع واختر الحركة التي كان إدخالها في يومك أسهل.",
            why: "مراجعة ما نجح تدعم الثقة وتساعد الخطة التالية على ملاءمة حياتك.",
            anchor: "نهاية الأسبوع",
            fallbackTitle: "لحظة جيدة واحدة",
            fallbackText: "اذكر لحظة واحدة هذا الأسبوع كانت فيها الحركة مقبولة.",
        },
    },
    "sleep-wake-time": {
        media: { icon: "AlarmClock", accent: "dusk", alt: "A morning alarm clock", altAr: "منبه صباحي", src: sleepWake },
        ar: {
            title: "حافظ على وقت استيقاظ واحد",
            text: "اختر وقت استيقاظ واقعيًا وحافظ عليه ضمن نحو نصف ساعة اليوم.",
            why: "وقت استيقاظ ثابت هو مرساة بسيطة لإيقاع نوم أكثر انتظامًا.",
            anchor: "منبه صباحك",
            fallbackTitle: "اختر وقت الغد",
            fallbackText: "حدد وقت استيقاظ واقعيًا واحدًا للغد واكتبه.",
        },
    },
    "sleep-wind-down": {
        media: { icon: "Moon", accent: "dusk", alt: "A dim, calm bedroom", altAr: "غرفة نوم هادئة بإضاءة خافتة", src: sleepWind },
        ar: {
            title: "تهدئة عشر دقائق",
            text: "خفّف الإضاءة وابتعد عن الشاشات عشر دقائق قبل النوم.",
            why: "إشارة تهدئة متكررة تساعد جسدك على إدراك أن اليوم ينتهي.",
            anchor: "قبل تنظيف أسنانك",
            fallbackTitle: "وقفة ثلاث دقائق",
            fallbackText: "خفّف الإضاءة وضع هاتفك بعيدًا عن متناولك ثلاث دقائق.",
        },
    },
    "sleep-worry-dump": {
        media: { icon: "Brain", accent: "dusk", alt: "A notebook for worries", altAr: "دفتر للمخاوف", src: sleepWorry },
        ar: {
            title: "أَرِح هموم الغد",
            text: "اكتب حتى ثلاثة أمور تشغل بالك، ثم ضع الملاحظة جانبًا حتى الصباح.",
            why: "وضع الهموم في مكان آخر قد يقلل العبء الذهني الذي يبقيك مستيقظًا.",
            anchor: "قبل تهدئتك",
            fallbackTitle: "قل شيئًا واحدًا بصوت مسموع",
            fallbackText: "اذكر شيئًا واحدًا يشغل بالك وذكّر نفسك أنه يمكن أن ينتظر حتى الصباح.",
        },
    },
    "sleep-room": {
        media: { icon: "BedDouble", accent: "dusk", alt: "A tidy, restful bedroom", altAr: "غرفة نوم مرتبة ومريحة", src: sleepRoom },
        ar: {
            title: "اجعل الغرفة مريحة للراحة",
            text: "غيّر شيئًا واحدًا يجعل مكان نومك أغمق أو أبرد أو أهدأ.",
            why: "تغيير صغير في البيئة يجعل الراحة أسهل دون الاعتماد على قوة الإرادة.",
            anchor: "قبل الدخول إلى السرير",
            fallbackTitle: "تعديل صغير واحد",
            fallbackText: "ابعد مصدر ضوء أو ضجيج واحدًا عن سريرك.",
        },
    },
    "sleep-caffeine": {
        media: { icon: "Coffee", accent: "dusk", alt: "Coffee and a glass of water", altAr: "قهوة وكوب ماء", src: sleepCaffeine },
        ar: {
            title: "اختر وقتًا لقطع الكافيين",
            text: "حدد وقتًا تتحول بعده إلى الماء أو مشروب آخر بلا كافيين.",
            why: "خطة واضحة تسهّل خيارًا مسائيًا واحدًا دون الحاجة إلى القرار في اللحظة.",
            anchor: "مشروبك المعتاد بعد الظهر",
            fallbackTitle: "استبدال متأخر واحد",
            fallbackText: "استبدل مشروبًا واحدًا متأخرًا بالكافيين بالماء أو خيار بلا كافيين.",
        },
    },
    "sleep-morning-light": {
        media: { icon: "Sunrise", accent: "dusk", alt: "Morning light through a window", altAr: "ضوء الصباح عبر نافذة", src: sleepMorning },
        ar: {
            title: "اخرج إلى ضوء الصباح",
            text: "اقضِ خمس دقائق في ضوء النهار بعد الاستيقاظ، أو افتح الستائر على مصراعيها.",
            why: "ضوء الصباح إشارة بسيطة تساعد جسدك على التمييز بين النهار والليل.",
            anchor: "بعد الاستيقاظ",
            fallbackTitle: "افتح الستائر",
            fallbackText: "افتح الستائر واجلس قرب ضوء النهار بضع دقائق.",
        },
    },
    "sleep-notice": {
        media: { icon: "ClipboardList", accent: "dusk", alt: "A simple sleep log", altAr: "سجل نومSimple", src: sleepNotice },
        ar: {
            title: "لاحظ نمط نومك",
            text: "دوّن ملاحظة بسيطة عن وقت نومك ووقت استيقاظك.",
            why: "ملاحظة النمط دون حكم قد تساعدك على اختيار التغيير الصغير التالي.",
            anchor: "في الصباح التالي",
            fallbackTitle: "سطر واحد",
            fallbackText: "اكتب سطرًا واحدًا عن شعورك في ليلتك.",
        },
    },
    "nutrition-veggie-first": {
        media: { icon: "Salad", accent: "honey", alt: "A plate of fresh vegetables", altAr: "طبق خضار طازجة", src: nutritionVeggie },
        ar: {
            title: "ابدأ بخضار",
            text: "ضع خضارًا واحدًا على طبقك قبل أي شيء آخر في إحدى الوجبات.",
            why: "بدء الوجبة بالخضار طريقة بسيطة لجعل الأكل المتوازن أسهل.",
            anchor: "وجبتك الرئيسية التالية",
            fallbackTitle: "خضار صغير واحد",
            fallbackText: "أضف حفنة واحدة من الخضار، طازجة أو مجمدة.",
        },
    },
    "nutrition-water-anchor": {
        media: { icon: "Droplets", accent: "honey", alt: "A glass of water", altAr: "كوب ماء", src: nutritionWater },
        ar: {
            title: "اربط كوب ماء",
            text: "اشرب كوب ماء مع روتين لديك بالفعل.",
            why: "ربط الماء بلحظة قائمة يجعل الخيار أسهل في التذكر.",
            anchor: "بعد الاستيقاظ أو قبل وجبة",
            fallbackTitle: "بضع رشفات",
            fallbackText: "خذ بضع رشفات من الماء في وقفتك المعتادة.",
        },
    },
    "nutrition-half-plate": {
        media: { icon: "UtensilsCrossed", accent: "honey", alt: "A balanced plate", altAr: "طبق متوازن", src: nutritionHalf },
        ar: {
            title: "اصنع طبق نصفه خضار",
            text: "املأ نحو نصف طبقك بالخضار أو الفاكهة في إحدى الوجبات.",
            why: "صورة الطبق البسيطة تجعل اختيار الحصص أقل تعقيدًا.",
            anchor: "وجبة في المنزل",
            fallbackTitle: "حفنة إضافية",
            fallbackText: "أضف حفنة إضافية من الخضار أو الفاكهة إلى طبقك.",
        },
    },
    "nutrition-protein-pair": {
        media: { icon: "Beef", accent: "honey", alt: "A plate with protein", altAr: "طبق فيه بروتين", src: nutritionProtein },
        ar: {
            title: "أضف بروتينًا",
            text: "أضف حصة بحجم راحة اليد من البروتين إلى إحدى الوجبات.",
            why: "البروتين مع الوجبة قد يجعلها أكثر إشباعًا وثباتًا.",
            anchor: "غداؤك أو عشاؤك المعتاد",
            fallbackTitle: "إضافة بروتين صغيرة",
            fallbackText: "أضف ملعقة من الفاصولياء أو الزبادي أو البيض إلى إحدى الوجبات.",
        },
    },
    "nutrition-mindful-pause": {
        media: { icon: "Wind", accent: "honey", alt: "A calm breath before eating", altAr: "نَفَس هادئ قبل الأكل", src: nutritionMindful },
        ar: {
            title: "توقف قبل الأكل",
            text: "خذ ثلاث أنفاس هادئة قبل أول لقمة.",
            why: "وقفة قصيرة تخلق مساحة لملاحظة الجوع والشبع.",
            anchor: "قبل وجبتك التالية",
            fallbackTitle: "نَفَس هادئ واحد",
            fallbackText: "خذ نَفَسًا هادئًا واحدًا قبل أن تبدأ الأكل.",
        },
    },
    "smoking-delay-5": {
        media: { icon: "Timer", accent: "sky", alt: "A timer against a clear sky", altAr: "مؤقت أمام سماء صافية", src: smokingDelay },
        ar: {
            title: "أجّل السيجارة التالية",
            text: "عندما تأتي الرغبة، انتظر خمس دقائق قبل أن تقرر أي شيء.",
            why: "الرغبات تعلو ثم تمر. التأجيل القصير يمنح الرغبة وقتًا لتخف.",
            anchor: "لحظة بدء الرغبة",
            fallbackTitle: "دقيقة واحدة أولًا",
            fallbackText: "انتظر دقيقة واحدة وخذ بضع أنفاس هادئة قبل أن تقرر.",
        },
    },
    "smoking-water-breath": {
        media: { icon: "GlassWater", accent: "sky", alt: "Water and calm breathing", altAr: "ماء وتنفس هادئ", src: smokingWater },
        ar: {
            title: "ماء وأنفاس هادئة",
            text: "اشرب بعض الماء وخذ خمس أنفاس هادئة عند بدء الرغبة.",
            why: "تغيير ما تفعله لبضع دقائق قد يقطع الرغبة.",
            anchor: "عند أول إشارة للرغبة",
            fallbackTitle: "ثلاثة أنفاس",
            fallbackText: "خذ ثلاثة أنفاس هادئة وارتشف بعض الماء.",
        },
    },
    "smoking-trigger-swap": {
        media: { icon: "Repeat", accent: "sky", alt: "Swapping one action for another", altAr: "استبدال عمل بآخر", src: smokingSwap },
        ar: {
            title: "استبدل محفزًا واحدًا",
            text: "اختر محفزًا معتادًا للتدخين وخطط لعمل بديل مدته دقيقتان.",
            why: "استبدال إشارة مألوفة ببديل صغير يجعل اللحظة أقل تلقائية.",
            anchor: "أكثر محفزاتك توقعًا",
            fallbackTitle: "استبدال صغير جدًا",
            fallbackText: "اختر عملًا واحدًا مدته دقيقتان للحظة محفزك القادمة.",
        },
    },
    "smoking-clear-cue": {
        media: { icon: "EyeOff", accent: "sky", alt: "Removing a smoking cue", altAr: "إزالة إشارة تدخين", src: smokingCue },
        ar: {
            title: "أزل إشارة تدخين",
            text: "أزل تذكيرًا يوميًا واحدًا بالتدخين من المكان الذي تقضي فيه وقتك.",
            why: "إبعاد الإشارة عن النظر قد يقلل عدد الرغبات التلقائية.",
            anchor: "مكان تستخدمه كل يوم",
            fallbackTitle: "انقل عنصرًا واحدًا",
            fallbackText: "انقل ولاعة أو منفضة أو علبة بعيدًا عن مرأى العين.",
        },
    },
    "smoking-notice-trigger": {
        media: { icon: "Search", accent: "sky", alt: "Noticing a craving trigger", altAr: "ملاحظة محفز الرغبة", src: smokingTrigger },
        ar: {
            title: "لاحظ محفزًا",
            text: "اكتب محفزًا واحدًا ومدى قوة الرغبة، دون حكم.",
            why: "ملاحظة النمط تساعدك على اختيار خطوة تكيّف مناسبة.",
            anchor: "بعد أن تمر الرغبة",
            fallbackTitle: "كلمة واحدة",
            fallbackText: "سمِّ محفزًا واحدًا بكلمة أو كلمتين.",
        },
    },
};

export function getExerciseContent(entry, locale) {
    if (!entry) return entry;

    const overlay = EXERCISE_CONTENT[entry.id];
    const adaptation = entry.adaptationTag
        ? ADAPTATION_AR[entry.adaptationTag]
        : null;
    const readiness =
        entry.readinessTag &&
            !(
                entry.readinessTag === "hot" &&
                entry.adaptationTag === "indoor_heat_safe"
            )
            ? READINESS_AR[entry.readinessTag]
            : null;

    if (locale === "ar") {
        if (!overlay?.ar && !adaptation && !readiness) return entry;

        let localized = overlay?.ar
            ? { ...entry, ...overlay.ar }
            : { ...entry };

        if (adaptation) {
            localized = {
                ...localized,
                anchor: adaptation.anchor,
                why: [localized.why, adaptation.why]
                    .filter(Boolean)
                    .join(" "),
            };
        }

        if (readiness) {
            localized = {
                ...localized,
                anchor: readiness.anchor,
                why: [localized.why, readiness.why]
                    .filter(Boolean)
                    .join(" "),
            };
        }

        return localized;
    }

    return entry;
}

export function getExerciseMedia(entry) {
    if (!entry) return DOMAIN_MEDIA.movement;

    const overlay = EXERCISE_CONTENT[entry.id];
    const base = DOMAIN_MEDIA[entry.domain] ?? DOMAIN_MEDIA.movement;

    return { ...base, ...(overlay?.media ?? {}) };
}

export { DOMAIN_MEDIA };
