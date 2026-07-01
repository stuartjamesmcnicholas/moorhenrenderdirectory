import './App.css'
import {  useEffect, useCallback, useState } from "react";
import { windowCootCCP4Loader } from "./windowCootCCP4Loader";

declare global {
    interface Window {
        _cootModuleLoading: boolean;
        _gemmiModuleLoading: boolean;
        _mathJaxLoading: boolean;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        cootModule: any;
    }
}

declare module "react" {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        webkitdirectory?: string;
    }
}

    interface MoleculesContainerJS {
        [key: string]: any;
        delete(): void;
        //set_max_number_of_simple_mesh_vertices(maxVertex: number);
        //get_max_number_of_simple_mesh_vertices(): numbers;
        get_overlap_dots(imol: number): void;
        set_colour_map_for_map_coloured_by_other_map(arg0: any): void;
        set_refinement_is_verbose(arg0: boolean): void;
        set_use_gemmi(arg0: boolean): void;
        get_use_gemmi(): boolean;
        export_molecular_representation_as_gltf(
            imol: number,
            cid: string,
            colourScheme: string,
            style: string,
            useSecondaryStructureScheme: number,
            fileName: string
        ): void;
        export_model_molecule_as_gltf(
            imol: number,
            cid: string,
            mode: string,
            isDark: boolean,
            bondWidth: number,
            atomRadius: number,
            bondSmoothness: number,
            drawHydrogens: boolean,
            drawMissingResidues: boolean,
            fileName: string
        ): void;
        export_map_molecule_as_gltf(
            imol: number,
            x: number,
            y: number,
            z: number,
            radius: number,
            contourLevel: number,
            fileName: string
        ): void;
        set_max_number_of_threads(arg0: number): void;
        set_map_is_contoured_with_thread_pool(arg0: boolean): void;
        close_molecule(molNo: number): number;
        copy_fragment_using_residue_range(molNo: number, chainId: string, res_no_start: number, res_no_end: number): number;
        writeCCP4Map(molNo: number, tempFilename: string): void;
        writeCIFASCII(molNo: number, tempFilename: string): void;
        writePDBASCII(molNo: number, tempFilename: string): void;
        molecule_to_mmCIF_string(imol: number): string;
        molecule_to_mmCIF_string_with_gemmi(imol: number): string;
        set_map_sampling_rate(arg0: number): void;
        fill_rotamer_probability_tables(): void;
        //read_coords_string(pdb_string: string, molecule_name: string): PairType<number, string>;
        set_user_defined_atom_colour_by_selection(
            imol: number,
            //indexedResiduesVec: emscriptem.vector<{ first: string; second: number }>,
            nonCarbon: boolean
        ): void;
        //set_user_defined_bond_colours(imol: number, colourMap: emscriptem.map<[number, number, number, number], number>): void;
        read_ccp4_map(arg0: string, arg2: boolean): number;
        associate_data_mtz_file_with_map(arg0: number, arg1: string, arg2: string, arg3: string, arg5: string): void;
        read_mtz(arg0: string, arg1: string, arg2: string, arg3: string, arg4: boolean, arg5: boolean): number;
        replace_map_by_mtz_from_file(arg0: number, arg1: string, arg2: string, arg3: string, arg4: string, arg5: boolean): number;
        replace_molecule_by_model_from_file(imol: number, tempFilename: string): void;
        import_cif_dictionary(tempFilename: string, associatedMolNo: number): number;
        //auto_read_mtz(tempFilename: string): emscriptem.vector<number>;
        read_pdb(tempFilename: string): number;
        set_show_timings: (arg0: boolean) => void;
        //new_positions_for_atoms_in_residues: (arg0: number, arg1: emscriptem.vector<MovedResidueT>) => number;
        get_map_spacegroup(arg0: number): string;
        get_map_data_resolution(arg0: number): number;
        //find_density_center(arg0: number, arg1: boolean): emscriptem.vector<number>;
    }

function App() {

    const [isCootAttached, setCootAttached] = useState(window.cootModule !== undefined);
    const [mc, setMc] = useState<MoleculesContainerJS|null>(null);
    const [meshes, setMeshes] = useState<ArrayBuffer[]>([]);

    const handleCootAttached = useCallback(() => {
        if (window.cootModule !== undefined) {
            setCootAttached(true);
            const molecules_container = new window.cootModule.molecules_container_js(false)
            molecules_container.set_use_gemmi(true)
            molecules_container.set_show_timings(false)
            molecules_container.set_refinement_is_verbose(false)
            molecules_container.set_map_sampling_rate(1.7)
            molecules_container.set_map_is_contoured_with_thread_pool(true)
            molecules_container.set_max_number_of_threads(3)
            window.cootModule.FS.mkdir("COOT_BACKUP")
            setMc(molecules_container)
        } else {
            console.warn("Unable to locate coot module... Cannot start.");
        }
    }, []);

    useEffect(() => {
        document.addEventListener("cootModuleAttached", handleCootAttached);
        return () => {
            document.removeEventListener("cootModuleAttached", handleCootAttached);
        };
    }, [handleCootAttached]);

    useEffect(() => {
        const loadCootModule = async() => {
            if (!window.cootModule){
                console.log("Attempting to load cootModule before starting")
                windowCootCCP4Loader(`./src`);
            }
        }
        loadCootModule()
    }, []);

    const downloadFile = (file: File, fileName: string) => {
        const url = window.URL.createObjectURL(file);

        const link = document.createElement("a");
        if(link){
            link.download = fileName;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            if(link.parentNode) link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
    }

    const doDownload = async() => {
        console.log(meshes)
        const fileName = "foo.glb"
        const file = new File([meshes[0]], fileName, { type: "application/octet-stream" });
        downloadFile(file,fileName)
    }

    const handleClick = async(e: React.ChangeEvent<HTMLInputElement>) => {
        const theseMeshes = []
        if(e.target.files&&mc){
            const files:File[] = [...e.target.files]
            for (const file of files) {
                const t:string = await file.text()
                const imol = mc.read_coords_string(t,file.name)
                const fileName = file.name+".glb"
                mc.export_molecular_representation_as_gltf(imol.first,"/*/*/*/*:*","","Ribbon",2,fileName)
                const gltfData = window.cootModule.FS.readFile(fileName, { encoding: 'binary' }) as ArrayBuffer
                window.cootModule.FS_unlink(fileName)
                theseMeshes.push(gltfData)
            }
        }
        setMeshes(theseMeshes)
    }
    

    return (
      <>
      <div>Hello, World!!</div>
      {isCootAttached && <input type="file" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleClick(e)} id="file-picker" name="fileList" webkitdirectory="true" multiple />}
      {meshes.length>0 && <button onClick={() => doDownload()}>Download</button> }
      </>
    )
}

export default App
