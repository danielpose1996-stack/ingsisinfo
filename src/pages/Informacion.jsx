import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { 
  Target, 
  Eye, 
  Info,
  Code,
  Shield,
  Network,
  Brain,
  Cpu
} from 'lucide-react';

export default function Informacion() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-tight">
            Semillero de Investigación <br /> 
            <span className="text-emerald-500">y Soluciones Informáticas</span>
          </h1>
          <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full" />
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants}>
            <GlassCard className="p-8 h-full border-t-4 border-t-emerald-500 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Info className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-500 italic">
                <Info className="w-5 h-5 font-bold" /> ¿QUÉ ES?
              </h3>
              <p className="text-foreground/70 leading-relaxed text-sm">
                Un espacio que promueve la agrupación de estudiantes y docentes para conformar grupos de trabajo que permiten formular proyectos de investigación e innovación.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-8 h-full border-t-4 border-t-blue-500 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Target className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-500 italic">
                <Target className="w-5 h-5 font-bold" /> MISIÓN
              </h3>
              <p className="text-foreground/70 leading-relaxed text-sm">
                SISINFO es un semillero que busca brindar soluciones informáticas a problemáticas de la región y el país teniendo en cuenta la relación de la Ciencia - Tecnología - Sociedad – Ambiente (CSTA), donde el estudiante adquiera competencias científicas, tecnológicas y ciudadanas que favorecen su participación en las organizaciones de ámbito educativa y empresarial.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-8 h-full border-t-4 border-t-amber-500 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Eye className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-500 italic">
                <Eye className="w-5 h-5 font-bold" /> VISIÓN
              </h3>
              <p className="text-foreground/70 leading-relaxed text-sm">
                Para el año 2030 el semillero de investigación SISINFO será reconocido en la región del Magdalena Medio por ser pionero en ofrecer soluciones informáticas a problemas del contexto, brindando a sus miembros conocimientos y destrezas generados por la aplicación de la ciencia, la tecnología y la ingeniería en la solución de problemas.
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>

        <div className="space-y-10 pt-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            <h2 className="text-2xl font-bold uppercase tracking-widest italic flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full" />
              Líneas de Investigación
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'INGENIERÍA DE SOFTWARE',
                desc: 'Se enfoca en el desarrollo de aplicaciones y sistemas informáticos mediante el uso de lenguajes de programación, frameworks y metodologías de desarrollo. En Ingeniería Informática, esta línea permite diseñar soluciones web, móviles y de escritorio, aplicando buenas prácticas como control de versiones, pruebas de software y arquitectura de sistemas.',
                icon: Code,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/5'
              },
              {
                title: 'GESTIÓN DE LA SEGURIDAD INFORMÁTICA',
                desc: 'Se orienta a la protección de sistemas, aplicaciones y bases de datos frente a amenazas digitales. Desde la Ingeniería Informática, incluye el desarrollo de aplicaciones seguras, implementación de autenticación, control de accesos, cifrado de datos y análisis de vulnerabilidades en entornos como aplicaciones web y servicios en la nube.',
                icon: Shield,
                color: 'text-red-500',
                bg: 'bg-red-500/5'
              },
              {
                title: 'REDES Y TELEMÁTICA',
                desc: 'Se centra en la comunicación entre sistemas informáticos a través de redes. En este campo, el ingeniero informático diseña e implementa soluciones que permiten la conectividad entre aplicaciones, servidores y dispositivos, incluyendo el uso de APIs, servicios web, arquitecturas cliente-servidor y despliegue en la nube.',
                icon: Network,
                color: 'text-blue-500',
                bg: 'bg-blue-500/5'
              },
              {
                title: 'INGENIERÍA DEL CONOCIMIENTO',
                desc: 'Se enfoca en el desarrollo de sistemas inteligentes capaces de procesar datos y generar conocimiento. En Ingeniería Informática, implica trabajar con inteligencia artificial, machine learning, bases de datos y analítica, permitiendo crear aplicaciones que apoyen la toma de decisiones y la automatización de procesos.',
                icon: Brain,
                color: 'text-purple-500',
                bg: 'bg-purple-500/5'
              },
              {
                title: 'ROBÓTICA',
                desc: 'Integra la programación con el control de dispositivos físicos automatizados. Desde la Ingeniería Informática, se enfoca en el desarrollo de software para controlar robots, sistemas embebidos y dispositivos inteligentes, utilizando lenguajes de programación, sensores y plataformas como Arduino o sistemas IoT.',
                icon: Cpu,
                color: 'text-amber-500',
                bg: 'bg-amber-500/5'
              }
            ].map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-6 h-full hover:border-emerald-500/30 transition-all group">
                  <div className={`w-12 h-12 rounded-xl ${line.bg} ${line.color} flex items-center justify-center mb-6 border border-current/10 group-hover:scale-110 transition-transform`}>
                    <line.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black mb-3 text-foreground tracking-tight uppercase leading-tight italic">
                    {line.title}
                  </h4>
                  <p className="text-xs text-foreground/50 leading-relaxed font-medium">
                    {line.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
