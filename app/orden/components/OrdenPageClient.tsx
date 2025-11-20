'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FormOrden } from './FormOrden';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

interface OrdenPageClientProps {
  session: Session;
}

export function OrdenPageClient({ session }: OrdenPageClientProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-run-gray-50 via-white to-run-gray-100">
      {/* Header decorativo */}
      <div className="bg-gradient-to-r from-brand-accent to-brand-primary h-2 w-full"></div>

      {/* User info bar */}
      <div className="bg-white border-b border-run-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-r.png"
                  alt="RUN Solutions Logo"
                  width={60}
                  height={60}
                  priority
                  className="object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-brand-primary">RUN Solutions</h1>
                  <p className="text-xs text-run-gray-600">Grupo Nearlink 360</p>
                </div>
              </div>

              {/* Separator */}
              <div className="hidden md:block h-12 w-px bg-run-gray-200"></div>

              {/* User info */}
              {session?.user && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                    {session.user.name?.charAt(0)?.toUpperCase() || 
                     session.user.email?.charAt(0)?.toUpperCase() || 
                     'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-run-gray-900">
                      {session.user.name || session.user.email || 'Usuario'}
                    </p>
                    <p className="text-xs text-run-gray-600">
                      {session.user.department || 
                       (session.user.role === 'admin' ? 'Administrador' : 'Usuario')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-run-gray-700 hover:text-brand-primary hover:bg-run-gray-100 rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Logo y header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center mb-6"
            >
              <div className="relative w-64 h-20">
                {/* Placeholder para logos - Los logos deben estar en /public/logos/ */}
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <div className="text-4xl font-bold text-brand-primary">
                    RUN
                  </div>
                  <div className="h-12 w-px bg-run-gray-300"></div>
                  <div className="text-2xl font-semibold text-run-gray-700">
                    Nearlink 360
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-run-gray-900 mb-3"
            >
              Orden de Autorización y Compra
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-run-gray-600 text-base md:text-lg max-w-2xl mx-auto"
            >
              Captura los datos y genera el PDF para firma de Dirección General
            </motion.p>
          </div>

          {/* Card principal del formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-card-hover p-6 md:p-8 lg:p-10"
          >
            <FormOrden />
          </motion.div>

          {/* Footer informativo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-center text-sm text-run-gray-600"
          >
            <p>
              Sistema de Órdenes de Compra y Autorización
              <br />
              <span className="text-xs">
                RUN Solutions &amp; Grupo Nearlink 360 © {new Date().getFullYear()}
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
