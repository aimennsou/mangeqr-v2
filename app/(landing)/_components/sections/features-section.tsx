import { Angry, Award, BatteryCharging, EyeOff, Gauge, Globe,  PhoneOff, Recycle, Send, Wand, Zap } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import FadeUp from '../Fadeup';

const features = [
    {
        icon: Wand,
        title: "Personnalisez votre menu facilement",
        description: "Créez un menu qui vous ressemble grâce à des options de personnalisation avancées.",
    },
    {
        icon: Send,
        title: "Renforcez l'engagement client avec des campagnes",
        description: "Créez et envoyez des campagnes marketing ciblées pour atteindre vos clients.",
    },
    {
        icon: BatteryCharging,
        title: "Réduisez les efforts grâce à des outils intelligents",
        description: "Gagnez du temps avec des outils conçus pour limiter les modifications répétitives.",
    },
    {
        icon: EyeOff,
        title: "Masquez facilement les plats indisponibles",
        description: "Cachez les plats en rupture de stock pour maintenir votre menu à jour.",
    },
    {
        icon: PhoneOff,
        title: "Des menus prêts à imprimer pour un usage hors ligne",
        description: "Générez des menus imprimables, parfaits lorsque les téléphones ne sont pas disponibles.",
    },
    {
        icon: Angry,
        title: "Gérez votre réputation en filtrant les avis",
        description: "Mettez en avant les avis positifs et filtrez les retours pour soigner votre image.",
    },
    {
        icon: Send,
        title: "Recontactez vos clients et fidélisez-les",
        description: "Envoyez des messages personnalisés pour inciter vos clients à revenir.",
    },
    {
        icon: Award,
        title: "Améliorez votre référencement avec les avis collectés",
        description: "Progressez sur Google en utilisant les avis clients pour renforcer votre crédibilité.",
    },
    {
        icon: Gauge,
        title: "Suivez chaque détail avec précision",
        description: "Analysez vos performances pour prendre des décisions éclairées en toute simplicité.",
    },
    
    
];

export default function FeaturesSection() {
    return (
        <section id="features" className="container mx-auto max-w-7xl px-4 py-16">




            
            <FadeUp delay={0.1} duration={0.8}>
            <h2 className="mb-8 text-center text-3xl font-bold">MangeQR&nbsp; bien plus qu&apos;un simple menu QR</h2>
            </FadeUp>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {features.map((feature, index) => (
                    <FadeUp key={feature.title} delay={0.2 + index * 0.2} duration={0.8}>
                        <Card className="border-none bg-inherit shadow-none">
                            <CardContent className="flex flex-col items-center space-y-2 p-6">
                                <feature.icon className="h-12 w-12 text-yellow-400" />
                                <h3 className="text-xl font-bold">{feature.title}</h3>
                                <p className="text-center text-zinc-500">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </FadeUp>
                ))}
            </div>
        </section>
    );
}

