import React, { useEffect, useReducer, useRef, useState } from "react";
import styles from "./ToDoList.module.scss";
import Task from "../Task/Task";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import toFarsiNumber from "../../utils/toFarsiNumber";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import Modal from "../Modal/Modal";
import ImportButton from "../ImportButton/ImportButton";
import ExportButton from "../ExportButton/ExportButton";

const ToDoList = ({ locale }) => {
  const { t } = useTranslation("");
  const importFileRef = useRef(null);
  const reducer = (tasks, action) => {
    switch (action.type) {
      case "add":
        return [
          ...tasks,
          {
            id: Date.now() + "-" + action.payload.title,
            title: action.payload.title,
            done: false,
          },
        ];
      case "toggle":
        return tasks.map((task) => {
          if (task.id === action.payload.id) {
            return {
              ...task,
              done: !task.done,
            };
          }
          return task;
        });
      case "delete":
        return tasks.filter((task) => task.id !== action.payload.id);
      case "edit":
        return tasks.map((task) => {
          if (task.id === action.payload.id) {
            return {
              ...task,
              title: action.payload.title,
            };
          }
          return task;
        });

      default:
        return tasks;
    }
  };
  const initialTasks = JSON.parse(localStorage.getItem("tasks") || null);
  const [tasks, dispatch] = useReducer(reducer, initialTasks || []);
  const [newTask, setNewTask] = useState("");
  const [error, setError] = useState({
    show: false,
    message: "",
  });
  const [showConfirmImportModal, setShowConfirmImportModal] = useState(false);
  const [importedtasks, setImportedtasks] = useState([]);

  const handleNewTaskAdd = (e) => {
    setNewTask(e.target.value);
    setError({ ...error, show: false });
  };

  const isValid = newTask.length >= 3 && newTask.length <= 255;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      dispatch({
        type: "add",
        payload: {
          title: newTask,
        },
      });
      setNewTask("");
      setError({ ...error, show: false });
    } else if (newTask.length < 3) {
      setError({ show: true, message: "input_must_be_at_least_3_characters" });
    } else if (newTask.length > 250) {
      setError({
        show: true,
        message: "input_cant_be_more_than_250_characters",
      });
    } else {
      setError({ ...error, show: false });
    }
  };

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  //export tasks to a .txt file
  const handleExportToFile = () => {
    const savingFormat = tasks.map((task, index) => {
      return `${locale === "fa" ? toFarsiNumber(index + 1) : index + 1} . ${
        task.title
      }\n`;
    });
    const file = new Blob(savingFormat, { type: "text/plain;charset=utf-8" });
    saveAs(file, "myTasks.txt");
  };

  //import tasks from a .txt file
  const handleImportFromFile = async (e) => {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      let temp = text.split("\n").map((string) => {
        let taskTitle = string.replace(/[0-9]{1,2} {0,1}. {0,1}/g, "");
        return taskTitle;
      });
      //remove empty element
      setImportedtasks(temp.filter((t) => t));
    };
    reader.readAsText(e.target.files[0]);
    setShowConfirmImportModal(true);
  };

  const handleModalClose = () => {
    setShowConfirmImportModal(false);
    handleClearImportedFile();
  };
  
  const handleConfirmImport = () => {
    importedtasks.forEach((task) => {
      dispatch({ type: "add", payload: { title: task } });
    });
    setShowConfirmImportModal(false);
    setImportedtasks([]);
    handleClearImportedFile();
  };

  const handleClearImportedFile = () => {
    if (importFileRef.current) {
      importFileRef.current.value = "";
      importFileRef.current.type = "text";
      importFileRef.current.type = "file";
    }
  };
  return (
    <>
      <div className={styles.importExportContainer}>
        <ImportButton
          handleChange={handleImportFromFile}
          importFileRef={importFileRef}
        />
        <ExportButton handleClick={handleExportToFile} />
      </div>

      <div
        className={styles.background}
        onClick={() => setError({ ...error, show: false })}
      ></div>
      <div
        className={
          styles.contentContainer +
          " " +
          (locale === "fa" ? styles.farsiToDoListContainer : "") +
          " " +
          (error.show ? styles.errorBox : "")
        }
      >
        <Modal
          show={showConfirmImportModal}
          handleClose={() => handleModalClose()}
          text="Are you sure you want to import tasks from this file?"
          handleConfirm={() => handleConfirmImport()}
          actions
        />
        <form onSubmit={handleSubmit}>
          <h1>{t("to_do_list")}</h1>
          <label>
            <input
              type="text"
              value={newTask}
              onChange={handleNewTaskAdd}
              placeholder={t("things_i_have_to_do")}
            />
            {isValid && (
              <button type="submit">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            )}
          </label>
        </form>

        <p
          className={
            styles.errorMessage +
            " " +
            (error.show ? styles.showError : styles.hideError)
          }
        >
          {t(error.message)}
        </p>
        <ul className={styles.list}>
          {tasks
            ?.sort((x, y) => (x.done === y.done ? 0 : x.done ? 1 : -1))
            .map((task, index) => (
              <Task
                task={task}
                dispatch={dispatch}
                key={task.id}
                error={error}
                setError={setError}
                index={locale === "fa" ? toFarsiNumber(index + 1) : index + 1}
              />
            ))}
        </ul>
      </div>
    </>
  );
};

export default ToDoList;
