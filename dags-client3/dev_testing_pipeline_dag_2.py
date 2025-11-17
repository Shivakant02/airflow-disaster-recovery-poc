from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import time
import random

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def start_task():
    """Start task - initializes the workflow"""
    print("Starting Client3 DAG 2 workflow...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("Start task completed!")
    return "start_completed"

def dev_build_task():
    """Development build task"""
    print("Building application in development...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("Development build completed!")
    return "dev_build_completed"

def dev_deploy_task():
    """Development deployment task"""
    print("Deploying to development environment...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("Development deployment completed!")
    return "dev_deploy_completed"

def end_task():
    """End task - finalizes the workflow"""
    print("Finalizing Client3 DAG 2 workflow...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("End task completed!")
    return "end_completed"

with DAG(
    'dev_testing_pipeline_dag_2',
    default_args=default_args,
    description='Client3 Development Testing Pipeline DAG 2',
    schedule_interval='@hourly',
    catchup=False,
    tags=['client3', 'development', 'deployment'],
) as dag:

    start = PythonOperator(
        task_id='start',
        python_callable=start_task,
    )

    build = PythonOperator(
        task_id='dev_build_task',
        python_callable=dev_build_task,
    )

    deploy = PythonOperator(
        task_id='dev_deploy_task',
        python_callable=dev_deploy_task,
    )

    end = PythonOperator(
        task_id='end',
        python_callable=end_task,
    )

    start >> build >> deploy >> end
