/**
 * Object collection helpers
 * @author Diego Oliveira <diego_sp_br@hotmail.com>
 */
class Collection extends Array {
    /**
     * @return {string|string<idRef>} Object UID key reference
     */
    get idKey(){
        /**
         * Object UID key reference
         * @type {string}
         * @default "id"
         */
        this.idRef = this.idRef || "id";
        return this.idRef;
    }
    set idKey(key){
        this.idRef = key;
    }

    /**
     * @return {string|string<sortRef>} Object key reference for sorting list
     */
    get sortKey(){

        /**
         * Object key reference for sorting list
         * @type {string}
         * @default {@link this.idKey idKey}
         */
        this.sortRef = this.sortRef || this.idRef;
        return this.sortRef;
    }
    set sortKey(key){
        this.sortRef = key
    }

    /**
     * @returns {Array} Ids list by {@link this.idKey idKey}
     */
    get ids(){
        this.sortByProp();
        return this.mapProp(this.idKey);
    }

    /**
     * @returns {Object} first element of list
     */
    get first(){
        this.sortByProp();
        return this[0];
    }

    /**
     * @returns {Object} last element of list
     */
    get last(){
        this.sortByProp();
        return this[this.length - 1];
    }

    /**
     * Find object in list by propertie
     * @param {String} prop - the propertie key
     * @param {any} value - value for comparision
     * @returns {Object} the first object found
     */
    findByProp(prop, value){
        return this.find(item => item && item[prop] === value);
    }

    /**
     * Find first object found in list by {@link this.idKey  propertie ID}
     * @param {any} id - the id for object
     * @returns {Object} the first object found
     *
     * @see {@link this.idKey The ID} is supposed to be unique for each object
     */
    findById(id){
        return this.findByProp(this.idKey, id);
    }

    /**
     * Find index of the first object found in list by propertie
     * @param {String} prop - the propertie key
     * @param {any} value - value for comparision
     * @returns {Object} index of the first object found
     */
    findIndexByProp(prop, value){
        return this.findIndex(item => item && item[prop] === value);
    }

    /**
     * Find index of the first object found in list with {@link this.idKey  propertie ID}
     * @param {any} id - the id for object
     * @returns {Object} the index of the first object found
     *
     * @see {@link this.idKey The ID} is supposed to be unique for each object
     */
    findIndexById(id){
        return this.findIndexByProp(this.idKey, id);
    }

    /**
     * Modifies list, removing first object found and re-sorting
     * @param {any} id - the id for object
     * @returns {Array} modified list without the object
     */
    removeById(id){
        this.splice(this.findIndexById(id), 1);
        this.sortByProp();
        return this;
    }

    /**
     * Modifies list, adding object to list and re-sorting
     * @param {object} item - the object to be added
     * @returns {Array} modified list with new object
     */
    add(item){
        this.push(item);
        this.sortByProp();
        return this;
    }

    /**
     * Modifies list, updating (or adding if id not found) object in the list
     * @param {any} id - id of object to update
     * @param {object} item - the object with updated values
     * @param {boolean} [forceNull = false] - force null assignment from source object
     * @returns {Object} updated/added item
     */
    update(id, item, forceNull = false){
        const itemData = this.findById(id);
        if(id && item && itemData){
            Object.assign(itemData, item);
            forceNull && Object.keys(item).forEach(key=>{ if (item[key] === null) itemData[key] = null })
        }else if(item){
            this.add(item);
        }
        this.sortByProp();
        return itemData || item;
    }

    /**
     * Map list into a new Collection instance
     * @param {function} callback - map function
     * @return {Collection} Mapped Collection
     */
    mapCollection(callback){
        return new Collection(...super.map(callback));
    }

    /**
     * Filter objects with same {@link this.idKey ID} values from list
     * @return {Collection} List filtered
     * @see this.idKey
     */
    filterDuplicatesById(){
        return this.filterDuplicatesByProp(this.idKey);
    }


    /**
     * Filter objects with same propertie value from list
     * @param {string} prop - object propertie name to look for duplicate values
     * @return {Collection} List filtered
     */
    filterDuplicatesByProp(prop){
        return this.filter((item, index, array)=>{
            return array.findIndex(data => data[prop] === item[prop]) === index
        });
    }

    /**
     * @param {string} prop - to be mapped
     * @param {boolean} [removeDuplicates = false] - without duplications
     * @returns {any[]} List of propertie values
     */
    mapProp(prop, removeDuplicates = false){
        const list = this.map(item => item[prop]);
        return (removeDuplicates) ? [...new Set(list)] : list;
    }

    /**
     * Sort list by propertie
     * @param {string} [prop = this.sortKey] - the propertie to sort list
     * @returns {Collection} this list
     */
    sortByProp(prop = this.sortKey){
        return this.sort((a,b)=>{
            a = a[prop], b = b[prop];
            if(typeof (a + b) === "number"){
                return a - b;
            }else{
                a = String(a).toLowerCase(), b = String(b).toLowerCase();
                return (a > b) ? 1 : (a < b) ? -1 : 0;
            }
        });
    }

    /**
     * Array of objects to Collection
     * @param {array<object>} list - Array list
     * @param {boolean} [forceCollection = false] - Force collections helpers for all Array of objects
     * @param {boolean} [recursive = false] - Look for children lists
     * @return {Collection|any} Array list with Collection helpers
     * @throws Error<"InvalidTypeException"|"InvalidFormatException">
     */
    static forArray(list, forceCollection = false, recursive = false){
        // on vérifie si c'est une liste
        if(!list || !Array.isArray(list)){
            if (recursive) return list;
            throw new Error("InvalidArgumentException");
        }

        // on vérifie si c'est une liste d'objets
        if(!list.every(obj => obj && obj.constructor && obj.constructor.name === "Object")){
            if (recursive) return list.map(obj => Collection.forJson(obj, forceCollection));
            throw new Error("InvalidTypeException");

        }

        if(forceCollection){
            // get all items params
            let params = list.reduce((paramsList, item)=> paramsList.concat(Object.keys(item)), []);
            // remove duplicates
            params = [...new Set(params)];
            // model object with null params
            params = params.reduce((obj, param)=> Object.assign(obj, {[param]:null}), {});
            // map all objects with same keys
            list = list.map(item => Object.assign({}, params, item));
        }

        // on vérifie si c'est une collection d'objets (tous les objets ont les mêmes clés)
        if(!list.every(obj => Object.keys(obj).sort().join("") === Object.keys(list[0]).sort().join(""))){
            if (recursive) return list.map(obj => Collection.forJson(obj, forceCollection));
            throw new Error("InvalidFormatException");
        }
        return  recursive
            ? new Collection(...list.map(obj => Collection.forJson(obj, forceCollection)))
            : new Collection(...list);
    }

    /**
     * Update recursivelly json object lists with Collection helpers
     * @param {object} json - json data with lists for Collection
     * @param {boolean} [forceCollection = false] - Force collections helpers for all Array of objects
     * @return {object} json updated
     */
    static forJson(json, forceCollection = false){
        // block others than a json object
        if(!json || typeof json !== "object"){
            return json;
        }

        // iterate all keys
        Object.entries(json).forEach( ([key, value]) =>{
            // if key value is an Array
            if(Array.isArray(value)){
                // check if its a list of objects
                const ofObjects = value.every(item => !Array.isArray(item) && typeof item === "object");
                if(ofObjects){
                    // set helpers
                    json[key] = Collection.forArray(value, forceCollection, true) || value;
                }
                // if a object check it recursively
            }else if(typeof value === "object"){
                json[key] = this.forJson(value);
            }
        })
        return json;
    }
}
