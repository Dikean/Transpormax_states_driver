import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Servicio genérico para operaciones CRUD
class FirebaseService {
  // Obtener todos los documentos de una colección
  async getAll(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error obteniendo ${collectionName}:`, error);
      throw error;
    }
  }

  // Obtener un documento por ID
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Documento no encontrado');
      }
    } catch (error) {
      console.error(`Error obteniendo documento ${id} de ${collectionName}:`, error);
      throw error;
    }
  }

  // Crear un nuevo documento
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creando documento en ${collectionName}:`, error);
      throw error;
    }
  }

  // Actualizar un documento
  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return id;
    } catch (error) {
      console.error(`Error actualizando documento ${id} en ${collectionName}:`, error);
      throw error;
    }
  }

  // Eliminar un documento
  async delete(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      console.error(`Error eliminando documento ${id} de ${collectionName}:`, error);
      throw error;
    }
  }

  // Consulta con filtros
  async getWithFilter(collectionName, field, operator, value) {
    try {
      const q = query(
        collection(db, collectionName), 
        where(field, operator, value),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error en consulta filtrada de ${collectionName}:`, error);
      throw error;
    }
  }
}

export default new FirebaseService();