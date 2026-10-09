// Mock lucide-react : renvoie un composant SVG neutre pour toute icône.
import { createElement as h } from 'react';
const icons = ['Lock','Save','UploadCloud','X','ChevronDown','ChevronRight','Play','Plus','Trash2','GripVertical','QrCode','Link2','ExternalLink','Eye','EyeOff','Copy','Check','Bell','CheckCircle2','XCircle','Loader2','Info','AlertTriangle','FileText','Image','Video','Youtube','CreditCard','Smartphone','ArrowLeft','ArrowRight','Sparkles','Crown','Star','Pencil','Printer','Mail','Phone','MapPin','Globe','Instagram','Facebook','Clock','Award','User','Users','Shield','Settings','LogOut','LayoutDashboard','UtensilsCrossed','BookOpen','Calculator','ChefHat','Landmark','Building2','Receipt','Hourglass','RefreshCw','Download','LockOpen','Gauge','Menu','Search'];
export const __esModule = true;
for (const name of icons) {
  // esbuild autorise les exports nommés statiques ; on crée un alias commun.
}
const I = (n) => (p) => h('svg', { 'data-icon': n, ...p });
export const Lock = I('Lock'); export const Save = I('Save'); export const UploadCloud = I('UploadCloud');
export const X = I('X'); export const ChevronDown = I('ChevronDown'); export const ChevronRight = I('ChevronRight');
export const Play = I('Play'); export const Plus = I('Plus'); export const Trash2 = I('Trash2');
export const GripVertical = I('GripVertical'); export const QrCode = I('QrCode'); export const Link2 = I('Link2');
export const ExternalLink = I('ExternalLink'); export const Eye = I('Eye'); export const EyeOff = I('EyeOff');
export const Copy = I('Copy'); export const Check = I('Check'); export const Bell = I('Bell');
export const CheckCircle2 = I('CheckCircle2'); export const XCircle = I('XCircle'); export const Loader2 = I('Loader2');
export const Info = I('Info'); export const AlertTriangle = I('AlertTriangle'); export const FileText = I('FileText');
export const Image = I('Image'); export const Video = I('Video'); export const Youtube = I('Youtube');
export const CreditCard = I('CreditCard'); export const Smartphone = I('Smartphone'); export const ArrowLeft = I('ArrowLeft');
export const ArrowRight = I('ArrowRight'); export const Sparkles = I('Sparkles'); export const Crown = I('Crown');
export const Star = I('Star'); export const Pencil = I('Pencil'); export const Printer = I('Printer');
export const Mail = I('Mail'); export const Phone = I('Phone'); export const MapPin = I('MapPin');
export const Globe = I('Globe'); export const Instagram = I('Instagram'); export const Facebook = I('Facebook');
export const Clock = I('Clock'); export const Award = I('Award'); export const User = I('User');
export const Users = I('Users'); export const Shield = I('Shield'); export const Settings = I('Settings');
export const LogOut = I('LogOut'); export const LayoutDashboard = I('LayoutDashboard');
export const UtensilsCrossed = I('UtensilsCrossed'); export const BookOpen = I('BookOpen');
export const Calculator = I('Calculator'); export const ChefHat = I('ChefHat'); export const Landmark = I('Landmark');
export const Building2 = I('Building2'); export const Receipt = I('Receipt'); export const Hourglass = I('Hourglass');
export const RefreshCw = I('RefreshCw'); export const Download = I('Download'); export const LockOpen = I('LockOpen');
export const Gauge = I('Gauge'); export const Menu = I('Menu'); export const Search = I('Search');
export default I;
